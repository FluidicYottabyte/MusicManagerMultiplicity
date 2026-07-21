(function () {
    "use strict";

    var audio = document.getElementById("player");
    var seekBar = document.getElementById("seek-bar");
    var volumeBar = document.getElementById("volume-bar");
    var playBtn = document.getElementById("btn-play");
    var prevBtn = document.getElementById("btn-prev");
    var nextBtn = document.getElementById("btn-next");
    var shuffleBtn = document.getElementById("btn-shuffle");
    var nowPlayingCover = document.getElementById("now-playing-cover");
    var nowPlayingTitle = document.getElementById("now-playing-title");
    var nowPlayingArtist = document.getElementById("now-playing-artist");

    if (!audio) {
        // Standalone pages (e.g. the login screen) have no player chrome at all.
        return;
    }

    // ---- Volume (persisted client-side; the original app's per-user
    // server-side Settings.json is replaced by localStorage, since the app
    // is now multi-user and per-device makes more sense) ----
    var savedVolume = parseFloat(localStorage.getItem("mm-volume"));
    audio.volume = isNaN(savedVolume) ? 0.5 : savedVolume;
    volumeBar.value = String(audio.volume);
    volumeBar.addEventListener("input", function () {
        audio.volume = parseFloat(volumeBar.value);
        localStorage.setItem("mm-volume", volumeBar.value);
    });

    // ---- Queue / playback state ----
    var queue = [];
    var playOrder = [];
    var orderPosition = -1;
    var shuffleEnabled = false;

    function currentItem() {
        if (orderPosition < 0 || orderPosition >= playOrder.length) return null;
        return queue[playOrder[orderPosition]];
    }

    function identityOrder(len) {
        var order = [];
        for (var i = 0; i < len; i++) order.push(i);
        return order;
    }

    // Fisher-Yates shuffle with a light anti-repeat tweak: avoid the new
    // shuffle's first pick being the same track that was just playing.
    function shuffledOrder(len, avoidFirstIndex) {
        var order = identityOrder(len);
        for (var i = order.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = order[i];
            order[i] = order[j];
            order[j] = tmp;
        }
        if (order.length > 1 && avoidFirstIndex !== undefined && order[0] === avoidFirstIndex) {
            var swapWith = 1 + Math.floor(Math.random() * (order.length - 1));
            var t = order[0];
            order[0] = order[swapWith];
            order[swapWith] = t;
        }
        return order;
    }

    function rebuildOrder(preferredStartQueueIndex) {
        var previousQueueIndex = currentItem() ? playOrder[orderPosition] : undefined;
        playOrder = shuffleEnabled
            ? shuffledOrder(queue.length, previousQueueIndex)
            : identityOrder(queue.length);
        if (preferredStartQueueIndex !== undefined) {
            var pos = playOrder.indexOf(preferredStartQueueIndex);
            orderPosition = pos === -1 ? 0 : pos;
        } else {
            orderPosition = 0;
        }
    }

    function highlightCurrentRow() {
        var rows = document.querySelectorAll(".song-row");
        var item = currentItem();
        rows.forEach(function (row) {
            row.classList.toggle("selected", !!item && row.getAttribute("data-id") === item.id);
        });
    }

    function play(item) {
        audio.src = "/stream/" + item.id;
        audio.play().catch(function () {
            /* Autoplay can be blocked before the first user gesture; ignore. */
        });
        nowPlayingTitle.textContent = item.title;
        nowPlayingArtist.textContent = item.artistNames || "";
        nowPlayingCover.src = item.coverURL || "/images/default-cover.png";
        highlightCurrentRow();
    }

    function setQueue(newQueue, startIndex) {
        queue = newQueue || [];
        rebuildOrder(startIndex || 0);
        var item = currentItem();
        if (item) play(item);
    }

    function next() {
        if (playOrder.length === 0) return;
        orderPosition = (orderPosition + 1) % playOrder.length;
        var item = currentItem();
        if (item) play(item);
    }

    function prev() {
        if (playOrder.length === 0) return;
        orderPosition = (orderPosition - 1 + playOrder.length) % playOrder.length;
        var item = currentItem();
        if (item) play(item);
    }

    audio.addEventListener("ended", next);

    playBtn.addEventListener("click", function () {
        if (!audio.src) return;
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });
    nextBtn.addEventListener("click", next);
    prevBtn.addEventListener("click", prev);
    shuffleBtn.addEventListener("click", function () {
        shuffleEnabled = !shuffleEnabled;
        shuffleBtn.classList.toggle("special", shuffleEnabled);
        var item = currentItem();
        rebuildOrder(item ? playOrder[orderPosition] : undefined);
    });

    // ---- Seek bar: suppress timeupdate-driven updates while the user is
    // actively dragging, matching the original app's drag-to-scrub behavior ----
    var isDragging = false;
    seekBar.addEventListener("mousedown", function () {
        isDragging = true;
    });
    seekBar.addEventListener("touchstart", function () {
        isDragging = true;
    });
    seekBar.addEventListener("change", function () {
        if (audio.duration) {
            audio.currentTime = (parseFloat(seekBar.value) / 100) * audio.duration;
        }
        isDragging = false;
    });
    audio.addEventListener("timeupdate", function () {
        if (isDragging || !audio.duration) return;
        seekBar.value = String((audio.currentTime / audio.duration) * 100);
    });

    window.MusicManagerPlayer = {
        setQueue: setQueue,
        next: next,
        prev: prev,
    };

    // ---- Delegated click handling for song rows: works across pjax content
    // swaps with no re-binding, since the listener lives on document. ----
    document.addEventListener("click", function (e) {
        var row = e.target.closest(".song-row");
        if (!row) return;
        var container = row.closest("[data-queue]");
        if (!container) return;
        var dataEl = container.querySelector('script[type="application/json"]');
        if (!dataEl) return;
        var rowQueue;
        try {
            rowQueue = JSON.parse(dataEl.textContent);
        } catch (err) {
            return;
        }
        var rows = Array.prototype.slice.call(container.querySelectorAll(".song-row"));
        var index = rows.indexOf(row);
        if (index === -1) return;
        setQueue(rowQueue, index);
    });

    // ---- Minimal pjax-style navigation shim: keeps audio playing across
    // "page" navigation. Every route still renders full real HTML (for
    // direct loads / no-JS / bots) — this just swaps the content region on
    // the client when JS is available. ----
    function swapContent(html, url) {
        var parsed = new DOMParser().parseFromString(html, "text/html");
        var newContent = parsed.getElementById("app-content");
        var currentContent = document.getElementById("app-content");
        if (!newContent || !currentContent) {
            // Target page doesn't use the shared chrome (e.g. the login
            // page after a session expired) — do a real navigation instead.
            window.location.href = url;
            return;
        }
        currentContent.innerHTML = newContent.innerHTML;
        document.title = parsed.title;
        highlightCurrentRow();
    }

    function navigate(url, pushState) {
        fetch(url, { credentials: "same-origin" })
            .then(function (response) {
                if (!response.ok) {
                    window.location.href = url;
                    return null;
                }
                return response.text();
            })
            .then(function (html) {
                if (html === null) return;
                if (pushState) {
                    history.pushState({ mmPjax: true }, "", url);
                }
                swapContent(html, url);
            })
            .catch(function () {
                window.location.href = url;
            });
    }

    document.addEventListener("click", function (e) {
        var link = e.target.closest("a");
        if (!link) return;
        if (link.target === "_blank" || link.hasAttribute("download")) return;
        if (link.hasAttribute("data-full-reload")) return;
        if (link.origin !== window.location.origin) return;
        if (link.getAttribute("href").indexOf("#") === 0) return;
        e.preventDefault();
        navigate(link.href, true);
    });

    window.addEventListener("popstate", function () {
        navigate(window.location.href, false);
    });
})();
