function getVid(uri) {
	return (uri.match(/[&?]v=([^&]+)/) || '')[1];
}

function getCurrentVid() {
	return getVid(document.location.href) || null;
}

function onLoad() {

	var $player, $chrome, video, $btn;
	var playerFinder;

	const START_MARGIN = 0.1;
	const END_MARGIN = 0.5;

	function secToTime(sec) {
		var min = Math.floor(sec/60);
		sec -= min * 60;
		var time = String(Math.round(sec*10)/10) + 's';
		if ( min ) {
			time = min + 'm ' + String(time);
		}
		return time;
	}

	function timeToSec(time) {
		var m = time.match(/(?:(\d+)m)?\s*(?:(\d+)s?)?/);
		if ( m ) {
			return Number(m[1] || 0) * 60 + Number(m[2] || 0);
		}
	}

	function promptTime(label, default1, default2) {
		var time = prompt(label, secToTime(default1 || default2));
		if ( time != null ) {
			var sec = time == '' ? default2 : timeToSec(time);
			if ( sec != null ) {
				return sec;
			}
		}
	}

	function onTimeUpdate(e) {
		if ( this.currentTime >= (this._ytRepeatEnd || this.duration - END_MARGIN) ) {
			this.currentTime = this._ytRepeatStart || START_MARGIN;
		}
	}

	function findPlayer() {
		$player = document.querySelector('#player-container:not(.ytd-miniplayer), :not(.skeleton) > #player-api, .html5-video-player.el-embedded');
		$chrome = document.querySelector('.ytp-right-controls') || document.querySelector('.ytp-chrome-controls');

		if ( $chrome && $player && $player.querySelector('video') ) {
			clearInterval(playerFinder);
			extendPlayer();
		}
	}
	playerFinder = setInterval(findPlayer, 500);

	function extendPlayer() {
		$bar = document.createElement('div');
		$bar.className = 'ytp-repeat-blue-bar';
		$bar.innerHTML = '<div class="active"></div>';
		$player.appendChild($bar);

		$btn = document.createElement('button');
		$btn.className = 'ytp-button ytp-repeat-button';
		$btn.textContent = 'R';
		$btn.onclick = function(e) {
			e.stopPropagation();

			video = $player.querySelector('video');
			var repeat = $player.classList.toggle('youtube-repeat-on');
			if ( repeat ) {
				video.addEventListener('timeupdate', onTimeUpdate);

				setTimeout(function() {
					if ( video._ytRepeatStart == null ) {
						video._ytRepeatStart = START_MARGIN;
					}
					if ( video._ytRepeatEnd == null ) {
						video._ytRepeatEnd = video.duration - END_MARGIN;
					}

					// Ask new START time
					var startSec = promptTime('START from what time?', video._ytRepeatStart);
					var endSec;
					if ( startSec != null ) {
						video._ytRepeatStart = Math.max(startSec, START_MARGIN);

						// Ask new END time
						endSec = promptTime('RESTART/END at what time?', video._ytRepeatEnd);
						if ( endSec != null ) {
							video._ytRepeatEnd = Math.min(endSec, video.duration - END_MARGIN);
						}
					}

					startSec = video._ytRepeatStart;
					endSec = video._ytRepeatEnd;

					// Add START - END to R button tooltip
					this.title = secToTime(startSec) + ' - ' + secToTime(endSec);

					// Scale blue bar represent repetition time
					$bar.firstChild.style.left = Math.round(startSec / video.duration * 100) + '%';
					$bar.firstChild.style.right = Math.round((1 - endSec / video.duration) * 100) + '%';
				}, 50);
			}
			else {
				video.removeEventListener('timeupdate', onTimeUpdate);

				this.title = '';
			}
		};
		$chrome.appendChild($btn);
	}

}

if ( document.readyState == 'complete' ) {
	console.log('ready');
	onLoad();
}
else {
	console.log('waiting for ready');
	window.addEventListener('load', onLoad);
}
