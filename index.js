$(function() {
	var SPACES_HORIZONTAL = 10;
	var SPACES_VERTICAL = 13;
	var SIZE = 50;
	var MAX_LEVEL = 3;
	var ROAD = [[4,0],[4,1],[5,1],[6,1],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[6,6],[5,6],[4,6],[3,6],[3,5],[2,5],[1,5],[1,6],[1,7],[1,8],[2,8],[3,8],[4,8],[4,9],[4,10],[4,11],[4,12]];
	var $board = $('#board');
	var $body = $('body');

	var removeMenu = function() {
		$('.menu.space').remove();
	};
	var createMenu = function(elm) {
		removeMenu();
		$(elm).append($('.template.menu-space').html().trim());
	};
	var removeTower = function(elm) {
		return $(elm).removeClass('tower').attr('data-level','0').addClass('empty');
	};
	var getPosition = function(x,y) {
		var $elm = $('[data-x='+x+'][data-y='+y+']');

		return  [$elm.css('left'), $elm.css('top')];
	};
	var addTower = (function() {
		var checkTowerLevelUp = function(level, x,y) {
			var coords = [[x,y], [x+1,y], [x+1,y+1], [x, y+1]];

			for (var i=0; i<coords.length; i++) {
				var coord = coords[i];

				if (!$('[data-level='+level+'][data-x='+coord[0]+'][data-y='+coord[1]+']').length) {
					return false
				}
			}

			return true;
		};
		var placeTower = function(level,x,y) {
			$('[data-x='+x+'][data-y='+y+']').removeClass('empty').addClass('tower').attr('data-level',level);
		};
		var removeTowers = function(x,y) {
			var coords = [[x,y], [x+1,y], [x+1,y+1], [x, y+1]];

			coords.forEach(function(coord) {
				removeTower($('[data-x='+coord[0]+'][data-y='+coord[1]+']'));
			});
		};

		return function(level, elm) {
			level = parseInt(level, 10);

			removeMenu();

			var x = $(elm).data('x');
			var y = $(elm).data('y');
			var checks = [[x-1,y-1], [x,y-1], [x,y], [x-1,y]];

			placeTower(level, x, y);

			if (level > MAX_LEVEL) {
				return;
			}

			for (var i=0; i<checks.length; i++) {
				var coord = checks[i];

				if (checkTowerLevelUp(level, coord[0], coord[1])) {
					removeTowers(coord[0], coord[1]);
					addTower(level+1, elm);
					return; // recursive upgrade
				}
			}
		}
	})();
	var isTowerClose = function($tower, $creep) {
		$tower = $($tower);
		$creep = $($creep);

		var tX = $tower.attr('data-x');
		var tY = $tower.attr('data-y');
		var cX = $creep.attr('data-x');
		var cY = $creep.attr('data-y');

		return Math.abs(tX-cX) <= 1 && Math.abs(tY-cY) <= 1;
	};
	var startShooting = function($tower, $creep) {
		$tower = $($tower);
		$creep = $($creep);

		var createBullet = function() {
			var $bullet = $($('.template.bullet-basic').html().trim());

			$bullet.css({
				left: $tower.css('left'),
				top: $tower.css('top')
			});
			$bullet.on('webkitTransitionEnd', function() {
				var creepEnergy = $creep.attr('data-energy');

				creepEnergy = Math.max(creepEnergy-10, 0);
				$creep.attr('data-energy', creepEnergy);

				if (!creepEnergy) {
					$creep.remove();
					$tower.removeClass('shooting');
				}

				$bullet.remove();
				if ($tower.hasClass('shooting')) {
					createBullet();
				}
			});

			$board.append($bullet);
			$bullet.css({
				left: $creep.css('left'),
				top: $creep.css('top')
			});
		};
		createBullet();
	}
	var checkShooters = function() {
		$('.tower').each(function() {
			var $tower = $(this);
			var tX = $tower.attr('data-x');
			var tY = $tower.attr('data-y');

			$('.creep').each(function() {
				var $creep = $(this);
				var cX = $creep.attr('data-x');
				var cY = $creep.attr('data-y');

				if (isTowerClose($tower, $creep)) {
					if (!$tower.hasClass('shooting')) {
						$tower.addClass('shooting');
						startShooting($tower, $creep);
					}
				} else {
					$tower.removeClass('shooting');
				}
			});
		});
	};
	var startCreep = function() {
		var x = ROAD[0][0];
		var y = ROAD[0][1];
		var $creep = $($('.template.creep-basic').html().trim());
		var currentPiece = 0;

		var next = function(e) {
			currentPiece++;
			if (currentPiece === ROAD.length) {
				$creep.remove();
				return;
			}

			var pos = getPosition(ROAD[currentPiece][0], ROAD[currentPiece][1]);
			var curX = parseInt($creep.css('left'), 10);
			var curY = parseInt($creep.css('top'), 10);
			var newX = parseInt(pos[0], 10);
			var newY = parseInt(pos[1], 10);

			$creep.removeClass('east west north south');

			if (newY > curY) { $creep.addClass('south'); }
			if (newY < curY) { $creep.addClass('north'); }
			if (newX > curX) { $creep.addClass('east'); }
			if (newX < curX) { $creep.addClass('west'); }

			$creep.css({
				left: newX,
				top: newY
			});
			$creep.attr({
				'data-x': ROAD[currentPiece][0],
				'data-y': ROAD[currentPiece][1]
			});
			checkShooters();
		};

		$creep
			.css({
				left: getPosition(x,y)[0],
				top: getPosition(x,y)[1]
			})
			.attr('data-energy', 100)
			.on('webkitTransitionEnd', function(e) {
				if (e.originalEvent.propertyName === 'top' || e.originalEvent.propertyName === 'left') {
					next();
				}
			});

		$board.append($creep);
		next();
	};

	var init = function() {
		var attachHandlers = function() {
			$body
				.on('click', '.empty.space', function(e) {
					e.stopPropagation();

					if ($('.menu', this).length) {
						removeMenu();
						return;
					}
					if ($('.tower.selected').length) {
						var level = $('.tower.selected').data('data-level'); // .data('level') seemed to not always yield the correct result

						removeTower($('.tower.selected')).removeClass('selected');
						addTower(level, this);
						return false;
					}
		 
					createMenu(this);
				})
				.on('click', '.tower.selected', function(e) {
					e.stopPropagation();
					$('.tower.selected').removeClass('selected');
				})
				.on('click', '.menu.space', function(e) {
					e.stopPropagation();
					addTower(1, $(this).parent());
				})
				.on('click', '.tower.space', function(e) {
					e.stopPropagation();
					$('.tower.selected').removeClass('selected');
					$(this).addClass('selected');
				})
				.on('click', function() {
					removeMenu();
				});
		};
		var createEmptySpaces = function() {
			for (var x=0; x<SPACES_HORIZONTAL; x++) {
				for (var y=0; y<SPACES_VERTICAL; y++) {
					var $html = $($('.template.empty-space').html().trim())
						.attr({
							'data-x':x,
							'data-y':y
						})
						.css({
							left: SIZE*x,
							top: SIZE*y
						});
					$board.append($html);
				}
			}
		};
		var createRoad = function() {
			ROAD.forEach(function(coord) {
				$('[data-x='+coord[0]+'][data-y='+coord[1]+']').removeClass('empty').addClass('road');
			});
		};

		createEmptySpaces();
		createRoad();
		startCreep();
		setTimeout(startCreep, 1000)
		setTimeout(startCreep, 2000)
		setTimeout(startCreep, 3000)
		setTimeout(startCreep, 4000)
		attachHandlers();
	};

	init();
});