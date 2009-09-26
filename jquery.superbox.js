/*
 * jQuery SuperBox! 0.9.2-dev
 * Copyright (c) 2009 Pierre Bertet (pierrebertet.net)
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * TODO :
 * - Document.load if init is before </body> against IE crash.
 * - Animations
 * - Image / Gallery mode : display a legend
*/
;(function($) {
	
	// Local variables
	var $curLink, $overlay, $wrapper, $container, $superbox, $closeBtn, $loading, $nextprev, $nextBtn, $prevBtn, settings,
	
	// Default settings
	defaultSettings = {
		boxId: "superbox",
		boxClasses: "",
		overlayOpacity: .8,
		boxWidth: "600",
		boxHeight: "400",
		loadTxt: "Loading...",
		closeTxt: "Close",
		prevTxt: "Previous",
		nextTxt: "Next",
		beforeShow: function(){},
		afterShow: function(){}
	},
	
	galleryGroups = {},
	galleryMode = false,
	hideElts = $([]);
	
	// Init dispatcher
	$.superbox = function() {
		
		// Settings
		settings = $.extend({}, defaultSettings, $.superbox.settings);
		
		// If IE6, select elements to hide
		if ($.browser.msie && $.browser.version < 7) {
			hideElts = hideElts.add("select");
		}
		
		// Create base elements
		createElements();
		
		// Dispatch types
		dispatch();
	};
	
	// Dispatch types
	function dispatch() {
		
		// Match all superbox links
		$("a[rel^=superbox],area[rel^=superbox]").each(function() {
			
			// Optimisation
			var $this = $(this),
			relAttr = $this.attr("rel"),
			
			// Match first argument. Ex: superbox[gallery#my_id.my_class][my_gallery] > gallery#my_id.my_class
			firstArg = relAttr.match(/^superbox\[([^\]]+)\]/)[1],
			
			// Match type. Ex: superbox[gallery#my_id.my_class][my_gallery] > gallery
			type = firstArg.match(/^([^#\.]+)/)[1],
			
			// Match additionnal classes or IDs (#xxx.yyy.zzz)
			boxCurrentAttrs = firstArg.replace(type, "").match(/([#\.][^#\.\]]+)/g) || [],
			
			// Box ID and classes
			newBoxId = settings.boxId,
			newBoxClasses = settings.boxClasses;
			
			// Prevent multiple inits
			if ($this.data("superbox_init")) { return; }
			$this.data("superbox_init", true);
			
			// Additionnal rel settings
			this._relSettings = relAttr.replace("superbox["+ type + boxCurrentAttrs.join("") +"]", "");
			
			// Redefine settings
			$.each(boxCurrentAttrs, function(i, val) { // each class or id
				if (val.substr(0,1) == "#") {
					newBoxId = val.substr(1);
					
				} else if (val.substr(0,1) == ".") {
					newBoxClasses += " " + val.substr(1);
				}
			});
			
			// Call type method
			if (type.search(/^image|gallery|iframe|content|ajax$/) != -1) {
				$this.superbox(type, {boxId: newBoxId, boxClasses: newBoxClasses});
			}
		});
	};
	
	/*-- Superbox Method --*/
	$.fn.superbox = function(type, curSettings) {
		curSettings = $.extend({}, settings, curSettings);
		$.superbox[type](this, curSettings);
		
	    this.click(function(e) {
	        e.preventDefault();
	        $curLink = this;
	    });
	};
	
	/*-- Types --*/
	$.extend($.superbox, {
		
		// Image
		image: function($elt, curSettings, type) {
            
			var relSettings = getRelSettings($elt.get(0)),
			dimensions = false;
			
			// Extra settings
			if (relSettings && type == "gallery") {
			    dimensions = relSettings[1];
			    
			} else if (relSettings) {
			    dimensions = relSettings[0];
		    }
			
			// On click event
			$elt.click(function() {
				
				prepareBox();
				
				// "Prev / Next" buttons
				if (type === "gallery") {
				    nextPrev($elt, relSettings[0]);
				}
				
				// Loading anim
				initLoading(function() {
					
					// Dimensions
					var dims = false,
					
					// Image
					$curImg;
					
					if (dimensions) {
						dims = dimensions.split("x");
					}
					
					// Image
					$curImg = $('<img src="'+ $elt.attr("href") +'" title="'+ ($elt.attr("title") || $elt.text()) +'" />');
					
					// On image load
					$curImg.load(function() {
						
						// Resize
						resizeImageBox($curImg, dims);
						
						// Id and Classes
						setBoxAttrs({boxClasses: "image " + curSettings.boxClasses, boxId: curSettings.boxId});
						
						// Show box
						showBox();
						
					}).appendTo($innerbox);
					
				});
				
			});
		},
		
		// Gallery
		gallery: function($elt, curSettings) {
			
			// Extra settings
			var extraSettings = getRelSettings($elt.get(0));
			
			// Create group
			if(!galleryGroups[extraSettings[0]]) {
			    galleryGroups[extraSettings[0]] = [];
			}
			
			// Add element to current group
			galleryGroups[extraSettings[0]].push($elt);
			
			$elt.data("superboxGroupKey", galleryGroups[extraSettings[0]].length - 1);
			
			// Image Box
			$.superbox["image"]($elt, curSettings, "gallery");
		},
		
		// iframe
		iframe: function($elt, curSettings) {
			
			// Extra settings
			var extraSettings = getRelSettings($elt.get(0));
			
			// On click event
			$elt.click(function() {
			    
				prepareBox();
				
				// Loading anim
				initLoading(function() {
					
					// Dimensions
					var dims = false,
					
					// iframe
					$iframe;
					
					if (extraSettings) {
						dims = extraSettings[0].split("x");
					}
					
					curSettings = $.extend({}, curSettings, {
						boxWidth: dims[0] || curSettings.boxWidth,
						boxHeight: dims[1] || curSettings.boxHeight
					});
					
					// iframe
					$iframe = $('<iframe src="'+ $elt.attr("href") +'" name="'+ $elt.attr("href") +'" frameborder="0" scrolling="auto" hspace="0" width="'+ curSettings.boxWidth +'" height="'+ curSettings.boxHeight +'"></iframe>');
					
					// On iframe load
					$iframe.load(function() {
						
						$iframe.unbind("load");
						
						// Specified dimensions
						$superbox.width( curSettings.boxWidth+"px" );
						$innerbox.height( curSettings.boxHeight+"px" );
						
						// Id and Classes
						setBoxAttrs({boxClasses: "iframe " + curSettings.boxClasses, boxId: curSettings.boxId});
						
						// Show box
						showBox();
						
					}).appendTo($innerbox);
				});
				
			});
		},
		
		// Content
		content: function($elt, curSettings) {
			// Extra settings
			var extraSettings = getRelSettings($elt.get(0));
			
			// On click event
			$elt.click(function() {
			    
				prepareBox();
				
				// Loading anim
				initLoading(function() {
					
					// Dimensions
					var dims = false;
					if (extraSettings) {
						dims = extraSettings[0].split("x");
					}
					
					curSettings = $.extend({}, curSettings, {
						boxWidth: dims[0] || curSettings.boxWidth,
						boxHeight: dims[1] || curSettings.boxHeight
					});
					
					// Specified dimensions
					$superbox.width( curSettings.boxWidth+"px" );
					$innerbox.height( curSettings.boxHeight+"px" );
					
					$($elt.attr('href')).clone().appendTo($innerbox).show();
					
					// Id and Classes
					setBoxAttrs({boxClasses: "content " + curSettings.boxClasses, boxId: curSettings.boxId});
					
					// Show box
					showBox();
				});
				
			});
		},
		
		// Ajax
		ajax: function($elt, curSettings) {
			
			// Extra settings
			var extraSettings = getRelSettings($elt.get(0));
			
			// On click event
			$elt.click(function() {
				
				prepareBox();
				
				// Loading anim
				initLoading(function() {
					
					// Dimensions
					var dims = false;
					if (extraSettings && extraSettings[1]) {
						dims = extraSettings[1].split("x");
					}
					
					// Extend default dimension settings
					curSettings = $.extend({}, curSettings, {
						boxWidth: dims[0] || curSettings.boxWidth,
						boxHeight: dims[1] || curSettings.boxHeight
					});
					
					// Specified dimensions
					$superbox.width( curSettings.boxWidth+"px" );
					$innerbox.height( curSettings.boxHeight+"px" );
					
					var splitUrl = extraSettings[0].split("#");
					var ajaxUrl = splitUrl[0];
					var anchor = splitUrl[1] || false;
					
					$.get( ajaxUrl, function(data) {
					    
					    // Get a specific element (by ID)?
					    if (anchor !== false) {
					        data = $(data).find("#" + anchor);
				        }
				        
					    $(data).appendTo($innerbox);
					});
					
					// Id and Classes
					setBoxAttrs({boxClasses: "ajax " + curSettings.boxClasses, boxId: curSettings.boxId});
					
					// Show box
					showBox();
				});
			});
		}
	});
	
	
	// Get extra settings in rel attribute
	function getRelSettings(elt) {
		return elt._relSettings.match(/([^\[\]]+)/g);
	};
	
	// Set image box dimensions
	function resizeImageBox($curImg, dims) {
		
		// Auto
		$superbox.width($curImg.width() + ($innerbox.css("paddingLeft").slice(0,-2)-0) + ($innerbox.css("paddingRight").slice(0,-2)-0)); // Padding ajouté, pour corriger le problème de définition padding sur $innerbox
		$innerbox.height($curImg.height());
		
		// Specified
		if (dims && dims[0] != "") {
			$superbox.width(dims[0] + "px");
		}
		if (dims && dims[1] != "" && dims[1] > $curImg.height()) {
			$innerbox.height(dims[1] + "px");
		}
	};
	
	// Next / Previous
	function nextPrev($elt, group) {
		
		$nextprev.show();
		
		galleryMode = true;
		
		var nextKey = $elt.data("superboxGroupKey") + 1,
		    prevKey = nextKey - 2;
		
		// Next
		if (galleryGroups[group][nextKey]) {
			$nextBtn.removeClass("disabled").unbind("click").bind("click", function() {
				galleryGroups[group][nextKey].click();
			});
		}
		else {
		    $nextBtn.addClass("disabled").unbind("click");
		}
		
		// Prev
		if (galleryGroups[group][prevKey]) {
			$prevBtn.removeClass("disabled").unbind("click").bind("click", function() {
				galleryGroups[group][prevKey].click();
			});
		}
		else {
		    $prevBtn.addClass("disabled").unbind("click");
		}
	};
	
	// Set ID and Class
	function setBoxAttrs(attrs) {
		$superbox.attr("id", attrs.boxId).attr("class", attrs.boxClasses);
	};
	
	// Hide Box
	function hideBox() {
	    $curLink.focus();
		$(document).unbind("keydown.superbox");
		$loading.hide();
		$nextprev.hide();
		$wrapper.hide().css({position: "fixed", top: 0});
		$innerbox.empty();
	};
	
	// Hide Box + Overlay
	function hideAll(callback) {
	    
		hideBox();
		$overlay.fadeOut(300, function() {
			// Show hidden elements for IE6
			hideElts.show();
		});
		galleryMode = false;
	};
	
	// "Loading..."
	function initLoading(callback) {
		
		// Keys shortcuts
		$(document).bind("keydown.superbox",function(e) {
		    
		    // Escape
			if (e.keyCode == 27) {
			    hideAll();
			}
		});
		
		var loading = function() {
			
			// IE6
			if($.browser.msie && $.browser.version < 7) {
				$wrapper.css({position: "absolute", top:"50%"});
			}
			
			// Hide elements for IE6
			hideElts.hide();
			
			$loading.show();
			callback();
		};
		
		if (galleryMode) {
			$overlay.css("opacity", settings.overlayOpacity).show();
			loading();
		}
		else {
			$overlay.css("opacity", 0).show().fadeTo(300, settings.overlayOpacity, loading);
		}
	};
	
	// "Prepare" box : Show $superbox with top:-99999px;
	function prepareBox() {
		$wrapper.show();
		$innerbox.empty();
		$superbox.css({position: "absolute", top: "-99999px"});
	};
	
	// Display box
	function showBox() {
		// Stop "Loading..."
		$loading.hide();
		
		// Keys shortcuts
		$(document).unbind("keydown.superbox.np").bind("keydown.superbox.np",function(e) {
		    
			// Left/right arrows
			if (e.keyCode == 39 && $nextBtn.is(":visible")) {
			    $nextBtn.click();
			    
			} else if (e.keyCode == 37 && $prevBtn.is(":visible")) {
			    $prevBtn.click();
			}
		});
		
		// Show $superbox
		$superbox.css({position: "static", top: 0, opacity: 0});
		
		// IE6 and IE7
		if ($.browser.msie && $.browser.version < 8) {
			$superbox.css({position: "relative", top:"-50%"});
			
		    // IE6
		    if ($.browser.msie && $.browser.version < 7) {
		        $wrapper.css({position: "absolute", top:"50%"});
		    }
		}
		
		// Position absolute if image height > window height
		if ( $(window).height() < $wrapper.height() ) {
			$wrapper.css({position: "absolute", top: ($wrapper.offset().top + 10) + "px"});
		}
		
		settings.beforeShow();
		
		$superbox.fadeTo(300,1, function(){
            settings.afterShow();
		}).focus();
	};
	
	// Create base elements (overlay, wrapper, box, loading)
	function createElements() {
		if (!$.superbox.elementsReady) {
		    
			// Overlay (background)
			$overlay = $('<div id="superbox-overlay"/>').appendTo("body").hide();
			
			// Wrapper
			$wrapper = $('<div id="superbox-wrapper"/>').appendTo("body").hide();
			
			// Box container
			$container = $('<div id="superbox-container"/>').appendTo($wrapper);
			
			// Box
			$superbox = $('<div id="superbox" tabindex="0"/>').appendTo($container);
			
			// Inner box
			$innerbox = $('<div id="superbox-innerbox"/>').appendTo($superbox);
			
			// "Next / Previous"
			$nextprev = $('<p class="nextprev"/>').appendTo($superbox).hide();
			$prevBtn = $('<a class="prev" tabindex="0" role="button"><strong><span>'+ settings.prevTxt +'</span></strong></a>').appendTo($nextprev);
			$nextBtn = $('<a class="next" tabindex="0" role="button"><strong><span>'+ settings.nextTxt +'</span></strong></a>').appendTo($nextprev);
			
			// Add close button
			$closeBtn = $('<p class="close"><a tabindex="0" role="button"><strong><span>'+ settings.closeTxt +'</span></strong></a></p>').prependTo($superbox).find("a");
			
			// "Loading..."
			$loading = $('<p class="loading">'+ settings.loadTxt +'</p>').appendTo($container).hide();
			
			// Hide on click
			$overlay.add($wrapper).add($closeBtn).click(function() {
				hideAll();
			});
			
			// Remove "hide on click" on superbox
			$superbox.click(function(e) {
				e.stopPropagation();
			});
			
			// Dont call this function twice
			$.superbox.elementsReady = true;
		}
	};
	
})(jQuery);