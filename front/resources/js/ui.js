// scroll lock plugin : 레이어팝업, 로딩 호출시 바닥페이지 스크롤 막는 플러그인
$.scrollLock = ( function scrollLockClosure() {
    'use strict';

    var $html      = $( 'html' ),
        // State: unlocked by default
        locked     = true,
        // State: scroll to revert to
        prevScroll = {
            scrollLeft : $( window ).scrollLeft(),
            scrollTop  : $( window ).scrollTop()
        },
        // State: styles to revert to
        prevStyles = {},
        lockStyles = {
            // 'overflow-y' : 'scroll',
            // 'position'   : 'fixed',
			'touch-action' : 'none',
			'-webkit-overflow-scrolling' : 'none',
			'overflow' : 'hidden',
            'width'      : '100%'
        }; 

    // Instantiate cache in case someone tries to unlock before locking
    saveStyles();

    // Save context's inline styles in cache
    function saveStyles() {
        var styleAttr = $html.attr( 'style' ),
            styleStrs = [],
            styleHash = {};

        if( !styleAttr ){
            return;
        }

        styleStrs = styleAttr.split( /;\s/ );

        $.each( styleStrs, function serializeStyleProp(idx, styleString ){
            if( !styleString ) {
                return;
            }

            var keyValue = styleString.split( /\s:\s/ );

            if( keyValue.length < 2 ) {
                return;
            }

            styleHash[ keyValue[ 0 ] ] = keyValue[ 1 ];
        } );

        $.extend( prevStyles, styleHash );
    }

    function lock() {
        var appliedLock = {};

        // Duplicate execution will break DOM statefulness
        if( locked ) {
            return;
        }

        // Save scroll state...
        prevScroll = {
            scrollLeft : $( window ).scrollLeft(),
            scrollTop  : $( window ).scrollTop()
        };

        // ...and styles
        saveStyles();

        // Compose our applied CSS
        $.extend( appliedLock, lockStyles, {
            // And apply scroll state as s tyles
            'left' : - prevScroll.scrollLeft + 'px',
            'top'  : - prevScroll.scrollTop  + 'px'
        } );

        // Then lock styles...
        $html.css( appliedLock );

        // ...and scroll state
        $( window )
            .scrollLeft( 0 )
            .scrollTop( 0 );

        locked = true;
    }

    function unlock() {
        // Duplicate execution will break DOM statefulness
        if( !locked ) {
            return;
        }

        // Revert styles
        $html.attr( 'style', $( '<x>' ).css( prevStyles ).attr( 'style' ) || '' );

        // Revert scroll values
        $( window )
            .scrollLeft( prevScroll.scrollLeft )
            .scrollTop(  prevScroll.scrollTop );

        locked = false;
    }

    return function scrollLock( on ) {
        // If an argument is passed, lock or unlock depending on truthiness
        if( arguments.length ) {
            if( on ) {
				if( $('#wrapper').height() >= window.innerHeight ){
					lock();
				}
            }
            else {
				unlock();
				//$('body').css('overflow','visible');
            }
        }
        // Otherwise, toggle
        else {
            if( locked ){
                unlock();
            }
            else {
                lock();
            }
        }
    };
}() );

/* UI common method & properties */
var UI = {
	// init/
	init : function(){
		//ios check
		var ua = navigator.userAgent.toLowerCase();
		var isIos = (ua.indexOf("ipod") > -1 || ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1);
		if (isIos) {
			$("body").addClass("ios");
		}


		//하단 fixed 버튼 있는 경우
		if( $('.page-btns, .page-btm').hasClass('fixed') ) {
			$('#contents').addClass('fixed-bottom');
			$('#contents').data('hasFixedButton' , true);
		}
	},
	/* form control */
	formControl : function(){
		var $formControl = $('.form-control');

		$formControl.each(function(){
			if( $(this).data('init') ) return;
			$(this).data('init' , true);

			var $this = $(this);
			var $input = $this.find('input, select, textarea');

			// clear button
			if( $input.is('input[type="text"]') || $input.is('input[type="email"]') ){
				if(!$input.hasClass('my-datepicker') || !$this.find('.count')){
					//TEXT 경우에만 자동 생성 그외 수동 입력
					if( !$this.find('.btn-clear').length ){
						$input.after('<button type="button" class="btn-clear"><span class="sr-only">입력필드 초기화</span></button>');
					}
				}
			}
			var $btn = $(this).find('.btn-clear');


			//valued
			if( $input.val() && !$input.prop('disabled') && !$input.prop('readonly')) {
				if(!$input.is('.datepicker')){
					//$this.addClass('valued');
				}
			}
			// disabled 일 경우
			if( $input.prop('disabled') ){
				$this.addClass('disabled');
			}
			// readonly 일 경우
			if( $input.prop('readonly') ){
				$this.addClass('readonly');
			}

			// action
			if(!$input.prop('disabled') && !$input.prop('readonly') ){

				// focus in
				$input.on('focusin' , function(){
					$this.addClass('active');
					if($(this).val() && !$input.is('.datepicker')){
						$(this).next($btn).show();
					}
				});

				// focus out
				var doNotFocus = false;
				$input.on('focusout', function(){
					if( doNotFocus ){ return }
					$this.removeClass('active');
					if( !$input.val() && !$input.is('.datepicker') ){
						$this.removeClass('valued valid');
						//$this.removeClass('valued valid invalid');
					}else if($input.is('.datepicker')){
						//$this.removeClass('valued');
					}else{
						$this.addClass('valued');
					}
					$btn.hide();
				});

				// 입력시
				$input.on('keyup' , function(){
					if( $input.val().length > 0 && !$input.is('.datepicker') ){
						$this.addClass('valued');
						$(this).next($btn).show();
					}else if($input.is('.datepicker')){
						$this.addClass('valued');
					}else{
						$this.removeClass('valued');
						$(this).next($btn).not('.count, .btn-search').hide();
					}
				});

				// value change
				$input.on('change.value' , function(){
					if( $input.val().length > 0 && !$input.is('.datepicker') ){
						$this.addClass('valued');
						$(this).next($btn).show();
					}else if($input.is('.datepicker')){
						$this.addClass('valued');
					}
					else{
						$this.removeClass('valued');
						$(this).next($btn).not('.count, .btn-search').hide();
					}
				});

				// 다른 버튼이 있을 경우 clear button 위치값 조정
				// if($this.find('button:not(.btn-clear)').length){
				// 	$btn.css('right', $input.outerWidth() - 25);
				// }

				// input clear
				$btn.on('mousedown' , function( e ){
					var _this = $(this);
					$input = _this.prev('input');

					doNotFocus = true;

					$input.val('');
					_this.hide();

					UI._afterRun(function(){
						$input.focus();
						doNotFocus = false;
					}, 0);
				});
			}
		});

		var $formCheck = $('.form-check');
		$formCheck.each(function(){
			if( $(this).data('init') ) return;
			$(this).data('init' , true);

			var $this = $(this);
			var $input = $this.find('input[type="checkbox"], input[type="radio"]');

			// disabled 일 경우
			if( $input.prop('disabled') ){
				$this.addClass('disabled');
			}
			// readonly 일 경우
			if( $input.prop('readonly') ){
				$this.addClass('readonly');
			}
		});
	},
	/* accordion */
	accordion : function(){
		var $accordion= $('.ui-accordion');

		$accordion.each(function(){
			if( $(this).data('init') || !$(this).find('dl').length ) return;
			$(this).data('init' , true);

			var $this = $(this);
			var isSingle = $this.data('type') == 'single' ? true : false;

			$this.on('click.toggle', '.acc-title button', function( evt , isFirst ){
				var $list = $this.find('dl');
				var $listAll = $this.find('dd.acc-cont');
				var $listParent = $(this).closest('dl');
				var $listContent = $(this).closest('dl').find('dd.acc-cont');

				if( isSingle ){
					if( !isFirst ){
						$listParent.toggleClass('open');
					}
					$listContent.stop(true, true).slideToggle();
				}else{
					$list.not($listParent).removeClass('open');
					if( !isFirst ){
						$listParent.toggleClass('open');
					}
					$listAll.not($listContent).slideUp();
					$listContent.stop(true, true).slideToggle();
				}
			});

			$this.find('>dl.open .acc-title button').trigger('click.toggle' , true);

		});
	},
	/* tab menu */
	tab : function(){
		var $tab = $('.ui-tab');

		$tab.each(function(){
			if( $(this).data('init') ) return;
			$(this).data('init' , true);

			var $this = $(this);
			var $tabMenu = $this.find('.tab-menu');
			var $tabList = $tabMenu.find('ul');
			var $tabM = $tabList.find('li');
			var $tabBtn = $('>*', $tabM);
			var $tabContent = $this.find('.tab-contents');

			$tabBtn.on('click.default' , function(){
				if($(this).is('button')){
					var tabParent = $(this).parent('li');
					var indexNum = tabParent.index();
					$tabM.removeClass('active');
					tabParent.addClass('active');
					$tabContent.removeClass('active');
					if($tabContent.eq( indexNum ).length) {
						$tabContent.eq( indexNum ).addClass('active');
					} else {
						$tabContent.eq( 0 ).addClass('active');
					}
				}
			});

			$tabBtn.on('click.scroll' , function(e){
				/* 탭메뉴 좌우 스크롤 */
				var contentWidth = $tabMenu.outerWidth();
				var btnWidth = Math.floor($(this).outerWidth());
				var leftPos = Math.floor($(this).parent('li').position().left);
				var scrollPos = $tabList.scrollLeft();
				var w = Math.floor(leftPos + scrollPos + (btnWidth/2) - (contentWidth/2) + 7);

				if($(this).is('button')){
					$tabList.stop().animate({
						scrollLeft : w
					} , 300 , function(){
						//
					});
				}else{
					$tabList.scrollLeft(w);
				}

				if($(this).is('a') && $(this).parent().hasClass('active')){
					e.preventDefault();
				}
			});

			/* 초기화 */
			$tabMenu.find('.active button').trigger("click");
			$tabMenu.find('.active a').trigger("click.scroll");

		});
	},

	/* tab menu 2번째*/
	tab2 : function(){
		var $tab2 = $('.ui-tab2');

		$tab2.each(function(){
			if( $(this).data('init') ) return;
			$(this).data('init' , true);

			var $this = $(this);
			var $tabMenu = $this.find('.tab-menu2');
			var $tabList = $tabMenu.find('ul');
			var $tabM = $tabList.find('li');
			var $tabBtn = $('>*', $tabM);
			var $tabContent = $this.find('.tab-contents2');

			$tabBtn.on('click.default' , function(){
				if($(this).is('button')){
					var tabParent = $(this).parent('li');
					var indexNum = tabParent.index();
					$tabM.removeClass('active2');
					tabParent.addClass('active2');
					$tabContent.removeClass('active2');
					if($tabContent.eq( indexNum ).length) {
						$tabContent.eq( indexNum ).addClass('active2');
					} else {
						$tabContent.eq( 0 ).addClass('active2');
					}
				}
			});

			$tabBtn.on('click.scroll' , function(e){
				/* 탭메뉴 좌우 스크롤 */
				var contentWidth = $tabMenu.outerWidth();
				var btnWidth = Math.floor($(this).outerWidth());
				var leftPos = Math.floor($(this).parent('li').position().left);
				var scrollPos = $tabList.scrollLeft();
				var w = Math.floor(leftPos + scrollPos + (btnWidth/2) - (contentWidth/2) + 7);

				if($(this).is('button')){
					$tabList.stop().animate({
						scrollLeft : w
					} , 300 , function(){
						//
					});
				}else{
					$tabList.scrollLeft(w);
				}

				if($(this).is('a') && $(this).parent().hasClass('active2')){
					e.preventDefault();
				}
			});

			/* 초기화 */
			$tabMenu.find('.active2 button').trigger("click");
			$tabMenu.find('.active2 a').trigger("click.scroll");

		});
	},

	/* tooltip */
	tooltip : function(){
		var $tooltip= $('.ui-tooltip');

		$tooltip.each(function(){
			if( $(this).data('init') ) return;
			$(this).data('init' , true);

			var $this = $(this);
			var $btn = $this.find('.btn-tooltip');
			var $btnClose = $this.find('.btn-tooltip-close');

			$btn.on('click' , function( e ){
				e.stopPropagation();
				$this.toggleClass('active');
			});

			$btnClose.on('click' , function(){
				$this.removeClass('active');
			});
		});
		// 다른 곳 클릭시 hide
		$tooltip.on('mouseleave', function(e){
			$tooltip.removeClass('active');
		});
	},
	/* layer popup */
	layerPop : function( target, makeDimmed = true ){

		var selector;
		if( typeof target != 'string' ){
			selector = target.selector
		}else{
			selector = target;
		}
		var $popup = $(selector);
		var $closeBtn = $(selector).find('.cancel, .confirm, .layer-close');

		if( $popup.is(':visible') ){
			return;
		}

		//211223 스크립트 수정
		if (makeDimmed) {
			//open
			UI._makeDimmed( $popup.last() );
		}

		$popup.show();


		UI._afterRun( function(){
			// 스크롤 영역 사이즈
			var h = $popup.height();
			var hh = $('header').outerHeight();
			var bh = $popup.find('.layer-btns').outerHeight();
			var th = $popup.find('.layer-header').outerHeight();
			var $scw = $popup.find('.layer-contents');

			if($popup.is('.fullpage')){
				$scw.css('height', h - th - (bh ? bh : 0))
				$popup.addClass('active');
			
				if (document.querySelector('body').classList.contains('ios')){
					let popvh = window.innerHeight * 0.01;
					$popup.css('--popvh', `${popvh}px`);
				}

			} else if($popup.is('.bottom-sheet')){
				// bottom-sheet 스크롤 영역 높이
				h = $(window).height() - (hh ? hh : 0)
				$scw.css('max-height', h - th - (bh ? bh : 0))
			}
			
			// 	$popup.addClass('active');
			// 	$scw.css('height', h-th-bh);
			// }

			$popup.addClass('active');
		});
		
		//close
		$closeBtn.off('click.close').on('click.close' , function(){
			if( typeof target.onClose == 'function' ){
				target.onClose.apply(null);
			}
			
			$popup.removeClass('active');

			UI._afterRun( function(){
				$popup.hide();

				UI._removeDimmed( $popup.last() );
			});
		});

		// dim click hide
		$('.dimmed').on('click', function() {
			UI.layerPopClose(target);
		});
	},
	layerPopClose : function( target ){
		var $popup = $(target);

		if( $popup.find('.layer-close').length ){
			$popup.find('.layer-close').trigger('click');
		}else{
			if( typeof target.onClose == 'function' ){
				target.onClose.apply(null);
			}
			
			$popup.removeClass('active');

			UI._afterRun( function(){
				if( $popup.hasClass('alert') && $popup.hasClass('script') ){
					$popup.remove();
				}else{
					$popup.hide();
				}

				UI._removeDimmed( $popup.last() );
			});
		}
	},
	//alert
	alert : function( option ){
		var setting = {
			title : '',
			innerHtml : '',
			cancel: false,
			cancelTxt : '아니요',
			confirmTxt : '예',
			onConfirm : $.noop,
			onCancel : $.noop,
		};
		var option = $.extend(setting , option);
		var preventCode = false;

		$('.layer.alert').each(function(){
			if( $(this).find('.inner-html').html() == option.innerHtml ){
				preventCode = true;
			}
		});
		/* 중복 코드일시 실행 불가 */
		if( preventCode ) { return }

		var layerHtmlTag = '<section class="layer alert script">';

		if( option.title != "" ){
			layerHtmlTag +=	'<div class="layer-header">';
			layerHtmlTag +=		'<h1 class="layer-title"></h1>';
			layerHtmlTag +=	'</div>';
		}

		layerHtmlTag +=	'<div class="layer-contents">';
		layerHtmlTag +=		'<div class="inner-html"></div>';
		layerHtmlTag +=	'</div>';
		layerHtmlTag +=	'<div class="layer-btns">';
		if( option.cancel ){
			layerHtmlTag +=		'<button type="button" class="btn-tertiary cancel">'+option.cancelTxt+'</button>';
			layerHtmlTag +=		'<button type="button" class="btn-primary confirm">'+option.confirmTxt+'</button>';
		}else{
			layerHtmlTag +=		'<button type="button" class="btn-primary confirm">확인</button>';
		}
		layerHtmlTag +=	'</div>';
		layerHtmlTag +='</section>';

		$('body').append( layerHtmlTag );

		var $layerPop = $('.layer.alert').last();
		var $title = $layerPop.find('.layer-title');
		var $html = $layerPop.find('.inner-html');
		var $cancel = $layerPop.find('.cancel');
		var $confirm = $layerPop.find('.confirm');

		UI._makeDimmed( $layerPop );

		$title.html( option.title );
		$html.html( option.innerHtml );

		// cancel function
		$cancel.on('click' , function(){
			option.onCancel.apply(null);
			closeLayer();
		});
		// confirm function
		$confirm.on('click' , function(){
			option.onConfirm.apply(null);
			closeLayer();
		});

		// open
		$layerPop.show();
		UI._afterRun( function(){
			$layerPop.addClass('active');
		});


		// hide
		function closeLayer(){
			$layerPop.removeClass('active');

			UI._removeDimmed( $layerPop );

			UI._afterRun( function(){
				$layerPop.remove();
			});
		}
	},
	// 로딩 보이기
	addLoading : function(){
		if ($('.ui-loading').length ) return;

		var loadingTag = '<div class="dimmed transparency active"></div><div class="ui-loading"><div class="loading"></div><span class="loading-logo"></span></div>';
		// var loadingTag = '<div class="dimmed active"></div><div class="ui-loading"><div class="loading"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>';

		$('body').append(loadingTag);
		//scroll lock 문제가 있을때는 scollLock 관련 삭제
		$.scrollLock(true);
	},
	// 로딩 보이기_new(로고없는버전)
	addLoading2 : function(){
		if ($('.ui-loading2').length ) return;

		var loadingTag = '<div class="dimmed transparency active"></div><div class="ui-loading2"><div class="loading"></div></div>';
		// var loadingTag = '<div class="dimmed active"></div><div class="ui-loading"><div class="loading"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>';

		$('body').append(loadingTag);
		//scroll lock 문제가 있을때는 scollLock 관련 삭제
		$.scrollLock(true);
	},
	removeLoaing : function(){
		var $loading = $('.ui-loading');

		if( $loading.length ){
			$loading.prev('.dimmed').remove();
			$loading.remove();
			// 오픈된 레이어가 없을 경우 scroll lock false
			if(!$('.layer:visible').length){
				$.scrollLock(false);
			}
		}
	},
	/* make dimmed */
	_makeDimmed : function( $target, afterShow = true ) {
		$target.before('<div class="dimmed" />');
		if (afterShow)  {
			UI._afterRun( function(){
				$('.dimmed').addClass('active');
			});
		} else {
			$('.dimmed').addClass('active');
		}


		// $('.dimmed').addClass('active');
		$.scrollLock(true);

		/* 딤드 클릭가능 */
		if( !$target.hasClass('alert script') ){//알럿 형식일땐 클릭 불가
				$('.menu-header').swipe({
					swipeRight:function(event, direction, distance, duration, fingerCount) {
						if( $('.menu-header > div > .layer-close').length ){    //메인 헤더 닫힘
							UI.layerPopClose( $target );
						}
					}
				});
				$('.dimmed').swipe({
					swipeRight:function(event, direction, distance, duration, fingerCount) {
						if( $('.menu-header > div > .layer-close').length ){    //메인 헤더 닫힘
							UI.layerPopClose( $target );
						}
					}
				});
			}

	},
	/* remove dimmed */
	_removeDimmed : function( $target ){

		$target.prev('.dimmed').removeClass('active');

		UI._afterRun( function(){
			$target.prev('.dimmed').remove();
			if( !$('.dimmed').length ){
				$.scrollLock(false);
			}
		});

	},
	/* after run */
	_afterRun : function( cb , time ){
		var time = time || 300;
		setTimeout( function(){
			cb();
		}, time);
	},
	goTop :  function() {
		$(document).on('click','.btn-goTop',function() {
			$('html, body').animate({
                scrollTop : 0
            }, 100);
            return false;
		})
	},
	allCheck : function() {
		$(document).on('click','#allCheck',function() {
			if ($("#allCheck").is(':checked')) {
                $("input[type=checkbox]").prop("checked", true);
            } else {
                $("input[type=checkbox]").prop("checked", false);
            }
		})
	},
	fileUpload : function() {
		$("#fileUpload").on('change',function(){
			var fileName = $("#fileUpload").val();
			$(".upload-name").val(fileName);
		  });
	},
	floatingBtn : function() {
		$(".btn-open").on('click',function(){
			$(".btn-open").toggleClass('down');
			$(".floating-menu").toggleClass('up');
			if ($(".btn-open").hasClass('down')) {
				UI._makeDimmed($(".floating-btn-wrap"), false);
			} else {
				UI._removeDimmed($(".floating-btn-wrap"));
			}
		});
	},
	navMenu : function() {
		var $navMenu = $('.ui-nav-menu');
		$navMenu.each(function() {
			var $depth2 = $(this).find('ul.depth2');
			if(!$depth2.length ) return;

			$depth2.find('li').each(function() {
				var $menu = $(this);
				var $depth3 = $(this).find('ul.depth3');

				if (!$depth3.length) {
					$menu.addClass('nav-single');
					return;
				}

				$depth3.slideUp();
				if ($menu.hasClass('open')) {
					$menu.find('ul.depth3').slideDown();
				}

				$menu.find('>a').on('click', function(e) {
					e.preventDefault();

					$depth2.find('li').not($menu).each(function() {
						if ($(this).hasClass('open')) {
							$(this).removeClass('open');
							$(this).find('ul.depth3').slideUp(300);
						}
					});

					$menu.toggleClass('open');
					$menu.find('ul.depth3').slideToggle(300);
				});
			});
		});
	},
	bgRevert : function() {
		$('.contents').scroll(function(){
			if($(this).scrollTop() > 0) {
				$('.wrapper[class*="-bg"]').addClass('revert');
			}else (
				$('.wrapper[class*="-bg"]').removeClass('revert')
			)
		});
	},
	bgHeadTrans : function() {
		$('.contents').scroll(function(){
			if($(this).scrollTop() > 0) {
				$('.wrapper[class*="bg-"]').addClass('trans');
			}else (
				$('.wrapper[class*="bg-"]').removeClass('trans')
			)
		});
	},
	bottomNav : function() {

		$(window).scroll(function() {
			if (!$('.bottom-nav').hasClass('navUp')) {
				$('.bottom-nav').addClass('navUp');
				clearTimeout($.data(this, 'scrollTimer'));
				$.data(this, 'scrollTimer', setTimeout(function() {
					// do something
					$('.bottom-nav').removeClass('navUp');
				}, 300));
			}



		});


	}
}
/* ready */
$(function () {
    UI.init(); //초기화
	UI.navMenu(); // gnb menu
	UI.accordion(); //아코디언
	UI.tab(); //탭
	UI.tab2(); //탭2 소모임추가
	UI.tooltip(); //툴팁
	UI.formControl(); //폼 컨트롤
	UI.goTop(); // go top
	UI.allCheck(); // 올 체크 및 올 체크 해제
	UI.fileUpload(); // file upload
	UI.floatingBtn(); //floating btn
	UI.bgRevert(); // 배경 반전
	UI.bgHeadTrans(); // header 배경색 반전
	UI.bottomNav(); //



	// btn top anmation
	$('.btn-goTop').removeClass('show');
	$(window).scroll(function () {
		if($(window).scrollTop() > 10) {
			$('.btn-goTop').addClass('show');
		}else {
			$('.btn-goTop').removeClass('show');
		}
	});

	// btn top anmation
	$('.btn-search2').removeClass('show');
	$(window).scroll(function () {
		if($(window).scrollTop() > 10) {
			$('.btn-search2').addClass('show');
		}else {
			$('.btn-search2').removeClass('show');
		}
	});

	// btn top anmation
	$('.btn-open').removeClass('show');
	$(window).scroll(function () {
		if($(window).scrollTop() > 10) {
			$('.btn-open').addClass('show');
		}else {
			$('.btn-open').removeClass('show');
		}
	});



	//메뉴 하단 위치 했을때 전체메뉴 클릭시 링크 막기
	$('.item-allmenu').click(function(e) {
		e.preventDefault();
		UI.layerPop('.menu-layer', false);
	});



	// $('.wrapper').addClass('SMUV');
	// $('.layer').addClass('SMUV');
	// $('.floating-btn').addClass('SMUV');
	// $('.logo').addClass('SMUV');
	// $('.main-logo').addClass('SMUV');



	// 테스트용
	// $('head').append( $('<link rel="stylesheet"/ type="text/css" />').attr('href', '../resources/css/eng.css') );
});

//토스트 알림
function toast() {
	var x = document.getElementById("toast");

	// Add the "show" class to DIV
	x.className = "show";

	// After 3 seconds, remove the show class from DIV
	setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}
//3초간 보이는 알림 221129 추가
function toast2() {
	var x = document.getElementById("toast2");

	// Add the "show" class to DIV
	x.className = "show2";

	// After 3 seconds, remove the show class from DIV
	setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

$(document).ready(function(){
	if(sessionStorage.getItem("theme") != "")
		$(".wrapper").addClass(sessionStorage.getItem("theme"))
})