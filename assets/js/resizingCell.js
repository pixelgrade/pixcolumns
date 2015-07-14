/*
 * version 1.1 2015-01-31
 * Requires jQuery v1.4.2 or later
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Authors: Damon Jung
 */

// https://github.com/hina10531/resizingCell

; (function ($) {
  $.fn.resizingCell = function (options) {
    return this.each(function () {
      var settings = $.extend({
        selector: options.selector ? options.selector : "td",
        thick: options.thick ? options.thick : 9,
        color: options.color ? options.color : "transparent",
        borderStyle: options.borderStyle ? options.borderStyle : "solid",
        borderColor: options.borderColor ? options.borderColor : "black",
        gridCols: options.gridCols ? options.gridCols : 12
      }, options);

      // DJ
      // false = resizing is off.
      // true = resizing is on.
      var resizingStatus = false;

      // DJ : Object model for Javascript, jQuery object and iframe object, and tinymce instance.
      var parentElement = {
        JavaScript      :   this,
        Jquery          :   $(this),
        Contents        :   $(this).contents().find("body"),
        Editor          :   $(tinymce.activeEditor.editorContainer)
      };

      // DJ : Resizing handler model.
      var attachedHandler = {
        eHandler : {
          selector    :   undefined,
          id          :   undefined
        },
        nHandler : {
          selector    :   undefined,
          id          :   undefined
        }
      };

      // DJ : Selected element, X, Y coordinates, and leverage.
      var selectedElement,
        originalX,
        originalY,
        leverage = settings.thick / 2;

      // DJ : Function group
      var methods = {
        // Updating changed value on target elements.
        fixedValue: function(selectedElement, tableElement) {
          if ($(tableElement).attr("data-rsc-fixed") != "true") {
            var previousWidthLost = 0;
            $(tableElement).find(settings.selector).each(function(index, td) {
              var w = $(td).width(),
                initialWidth = w,
                h = $(td).height();

              //now do some snapping

              //first add the previous lost width
              w += previousWidthLost;

              //count the total width of the columns (table cells) regardless of border-spacing, border width and so on
              var totalColumnsWidth = 0;
              $(td).parents("tr").children("td").each(function() {
                totalColumnsWidth += $(this).width();
              });

              var gridUnitWidth = totalColumnsWidth/settings.gridCols;
              if ( w % gridUnitWidth < Math.round( gridUnitWidth / 2 ) ) {
                //don't allow columns to have 0 width
                if ( w < gridUnitWidth ) {
                  w = gridUnitWidth;
                } else {
                  //push it to the previous grid size
                  w = Math.floor(w / gridUnitWidth) * gridUnitWidth;
                }
              } else {
                //push it to the next grid unit
                w = ( Math.floor(w / gridUnitWidth) + 1 ) * gridUnitWidth;
              }

              previousWidthLost = (previousWidthLost > -1 && previousWidthLost < 1) ? Math.round(initialWidth - w) : 0;

              //do not allow the next column to become 0 width
              //do a forward lookup
              var $nextCol = $(td).next('td');
              if ($nextCol.length && previousWidthLost !== 0 && ($nextCol.width() + previousWidthLost) < Math.round(gridUnitWidth / 2 ) && w > gridUnitWidth) {
                w -= gridUnitWidth;
                previousWidthLost += gridUnitWidth;
              }

              $(td).css("width", w).css("height", h);
              $(td).attr("data-rsc-width", w + 'px').attr("data-rsc-height", h + "px");
              $(td).attr("data-mce-style", "width:" + w + "px; " + "height:" + h + "px; " + "border: 1px " + settings.borderStyle + " " + settings.borderColor + "; border-top: 0; border-right: 0;");

            });
            $(tableElement).attr("data-rsc-fixed", "true");
            $(tableElement).css("width", $(tableElement).outerWidth()).attr("data-mce-style", "width:" + $(tableElement).outerWidth() + "px;").attr("data-rsc-width", $(tableElement).outerWidth());
            $(tableElement).css("height", "auto").attr("data-mce-style", "height:auto").attr("height", "auto");
            parentElement.Contents.css("padding-bottom", "50px");
          };
        },

        // DJ : Invoke handlers generating method.
        // Improve me !! getContents has now no more than invoking attachHandler function.
        // Improve me !! If possible, get rid of getContents and just call attachHandler.
        getContents: function(parentElement, selector) {
          selectedElement = $(selector);
          methods.attachHandler(selectedElement, selector.offsetParent);
        },

        // DJ : Create handlers and attach them.
        attachHandler: function(selectedElement, tableElement) {
          if ( parentElement.Contents.find(attachedHandler.eHandler.id).length == 0 ) {
            if (attachedHandler.eHandler.selector != undefined || attachedHandler.nHandler.selector != undefined) {
              attachedHandler.eHandler.selector.remove();
              attachedHandler.nHandler.selector.remove();
            }
            var eHandler = $('<div id="horizontalResize"></div>'),
              nHandler = $('<div id="verticalResize"></div>'),
              position = selectedElement.offset(),
              dimension = {
                width : selectedElement.outerWidth(),
                height : selectedElement.outerHeight()
              };

            attachedHandler = {
              eHandler : {
                selector : eHandler,
                id : '#'+eHandler.attr('id')
              },
              nHandler : {
                selector : nHandler,
                id : '#'+nHandler.attr('id')
              }
            };

            eHandler.appendTo(parentElement.Contents)
              .css('position', 'absolute')
              .css('top', position.top)
              .css('left', position.left + dimension.width - leverage)
              .css('height', dimension.height)
              .css('width', settings.thick)
              .css('cursor', 'e-resize')
              .css('background-color', 'transparent')
              .end()
              .mousedown(function(e) {
                if ( resizingStatus == false ) {
                  e.preventDefault ? e.preventDefault() : e.returnValue = false;
                  originalX = e.pageX;
                  methods.resizeStart(attachedHandler, $(this));
                }
              }).mouseup(function(e) {
                methods.resizeEnd(selectedElement);
              }).mouseenter(function(e) {
                parentElement.Contents.attr('contentEditable', false).css('cursor', 'e-resize');
              }).mouseout(function(e) {
                parentElement.Contents.attr('contentEditable', true).css('cursor', 'auto');
              })
              .end();

            nHandler.appendTo(parentElement.Contents)
              .css('position', 'absolute')
              .css('top', position.top + dimension.height - leverage)
              .css('left', position.left)
              .css('height', settings.thick)
              .css('width', dimension.width)
              .css('cursor', 's-resize')
              .css('background-color', settings.color)
              .mousedown(function(e) {
                if ( resizingStatus == false ) {
                  e.preventDefault ? e.preventDefault() : e.returnValue = false;
                  originalY = e.pageY;
                  methods.resizeStart(attachedHandler, $(this));
                }
              }).mouseup(function(e) {
                methods.resizeEnd(selectedElement);
              }).mouseenter(function(e) {
                // improve me !!
                // It loses focus when typing is ongoing, stupid experience for users.
                // And also compatibility problem, cursor style doesn't change on IE8.
                parentElement.Contents.attr('contentEditable', false).css('cursor', 's-resize');
              }).mouseout(function(e) {
                parentElement.Contents.attr('contentEditable', true).css('cursor', 'auto');
              })
              .end();
          }
        },

        // DJ : Positioning handlers.
        positionHandler: function(selectedElement) {
          if (!resizingStatus) {
            var position = selectedElement.offset(),
              dimension = {
                width : selectedElement[0].clientWidth,
                height : selectedElement[0].clientHeight
              };

            attachedHandler.eHandler.selector
              .css('top', position.top)
              .css('left', position.left + dimension.width - leverage)
              .css('height', dimension.height)
              .css('width', settings.thick)
              .end();

            attachedHandler.nHandler.selector
              .css('top', position.top + dimension.height - leverage)
              .css('left', position.left)
              .css('height', settings.thick)
              .css('width', dimension.width)
              .end();
          }
        },

        // DJ : resizing in process.
        resizeStart: function(attachedHandler, currentHandler) {
          resizingStatus = true;

          var table = $(selectedElement.context.offsetParent),
            parent = selectedElement.parent(),
            child = parent.find(settings.selector),
            isRight = selectedElement.next()[0] ? true : false,
            targetIndexing = 0,
            nextIndexing = 0,
            rowIndexing = 0,
            resizeTarget = [],
            nextTarget = [],
            rowTarget = [],
            sorted,
            selected,
            nextSelected;

          // DJ : if an user trying to resize vertically
          if (currentHandler.is(attachedHandler.nHandler.selector)) {
            var bottomOld = selectedElement.offset().top + selectedElement.height();

            table.find(settings.selector).each(function(index, td) {
              var bottomNow = $(td).offset().top + $(td).height();
              if ( bottomNow == bottomOld || (bottomNow + 5 > bottomOld && bottomNow - 5 < bottomOld) ){
                rowTarget[rowIndexing] = td;
                rowIndexing++;
              }
            });

            $(rowTarget).each(function(index, td) {
              var rowspan = $(td).attr("data-rsc-rowspan") ? parseInt($(td).attr("data-rsc-rowspan"), 10) : 1;
              if ( rowspan == 1 ) {
                sorted = td;
                return false;
              }
            });
          } else {
            // DJ : if an user trying to resize horizontally
            var rightOld = selectedElement.offset().left + selectedElement[0].clientWidth;

            table.find('td').each(function(index, td) {
              var rightNow = $(td).offset().left + td.clientWidth;
              if ( rightNow == rightOld || (rightNow + 5 > rightOld && rightNow - 5 < rightOld) ) {
                resizeTarget[targetIndexing] = td;
                targetIndexing++;
                // Improve me !!
                // Try to avoid indexing. Try to find a better, simpler way.
              }
            });

            // DJ : Try resizing the right next one
            var nextRight = selectedElement.offset().left + selectedElement[0].clientWidth;

            table.find('td').each(function(index, td) {
              var colPos4 = $(td).offset();
              if ( colPos4.left >= nextRight - 10 && colPos4.left <= nextRight + 10 ) {
                nextTarget[nextIndexing] = td;
                nextIndexing++;
                // Improve me !!
                // Try to avoid indexing. Try to find a better, simpler way.
              }
            });
          }

          $(resizeTarget).each(function(index, td) {
            var colspan = $(td).attr("data-rsc-colspan") ? true : false;

            if (!colspan) {
              selected = $(td);
              return false;
            };
          });

          $(nextTarget).each(function(index, td) {
            var colspan = $(td).attr("data-rsc-colspan") ? true : false;

            if (!colspan) {
              nextSelected = $(td);
              return false;
            };
          });


          if ( selected == undefined ) {
            selected = selectedElement;
          }

          // DJ : Invoked if cursor is moving, while users are mousedowning.
          // This is where the actual calculation for the resize is being made.
          $(parentElement.Contents).mousemove(function(e) {

            // Improve me !!
            // If this attributes isn't set to false, the blue-selected area will dominate the table, causing some problems.
            // But setting to false causes a lost of focus while users are typing.
            parentElement.Contents.attr('contentEditable', false).css('cursor', currentHandler.css('cursor'));

            var position = $(selected).offset(),
              resized,
              width;

            if ( currentHandler.is(attachedHandler.eHandler.selector[0]) ) {
              if ( e.pageX <= position.left + settings.thick || e.pageX >= position.left + selected.width() + (nextSelected ? nextSelected.width() : 100) - settings.thick)
              {
                //console.log('resized limits');
              } else {
                //handle the width modifying
                width = selected.width();
                resized = position.left + width - e.pageX;
                attachedHandler.eHandler.selector.css('left', e.pageX - leverage);
                attachedHandler.nHandler.selector.css('width',width - resized );

                $(resizeTarget).each(function(ind, td) {
                  $(td).css('width', parseInt(td.style.width, 10) - parseInt(resized, 10));
                });

                //see if we have modified the outer limits of the table
                if ( selected.next()[0] != undefined ) {
                  $(nextTarget).each(function(ind, td) {

                    $(td).css('width', parseInt(td.style.width, 10) + parseInt(resized, 10));
                  });
                } else {
                  //modify the table width
                  table.css('width', parseInt(table.outerWidth(), 10) - parseInt(resized, 10));
                }
              }
            } else {
              position = $(sorted).offset();
              resized = position.top + $(sorted).outerHeight() - e.pageY;
              attachedHandler.nHandler.selector.css('top', e.pageY);
              attachedHandler.eHandler.selector.css('height', $(sorted).outerHeight() - resized );
              $(rowTarget).css('height', $(sorted).outerHeight() - resized );
            }
          });

          // DJ : Mouse up event.
          parentElement.Contents.unbind('mouseup').bind('mouseup', function(e) {
            methods.resizeEnd(selectedElement);
          });

          // DJ : Mouse leave event.
          parentElement.Contents.unbind('mouseleave').bind('mouseleave', function(e) {
            methods.resizeEnd(selectedElement);
          });

          //DJ : Event for mouse to leave from toolbar and editor area.
          parentElement.Editor.unbind('mouseleave').bind('mouseleave', function(e) {
            methods.resizeEnd(selectedElement);
          });
        },

        // DJ : Resize process ends, initializing all.
        resizeEnd: function(selectedElement) {
          $(selectedElement.context.offsetParent).attr("data-rsc-fixed", 'false');
          methods.fixedValue(selectedElement, $(selectedElement.context.offsetParent));
          parentElement.Contents.attr('contentEditable', true).css('cursor', 'auto');

          targetIndexing = 0;
          nextIndexing = 0;
          rowIndexing = 0;
          isHandler = false;
          resizingStatus = false;
          selectedElement = undefined;

          attachedHandler.eHandler.selector
            .unbind('mousedown')
            .unbind('mouseup')
            .unbind('mouseenter')
            .unbind('mouseout')
            .remove()
            .end();

          attachedHandler.nHandler.selector
            .unbind('mousedown')
            .unbind('mouseup')
            .unbind('mouseenter')
            .unbind('mouseout')
            .remove()
            .end();

          parentElement.Contents.unbind('mousemove');
          parentElement.Contents.unbind('mouseup');
        }
      }

      // DJ : After a table is completely loaded and an user put a mouse on a target element, plugin starts.
      parentElement.Contents.on("mouseover", settings.selector, function(e) {
        if ( $(e.target).is( settings.selector) ) {
          if ( $(e.target.offsetParent).attr("data-rsc-fixed") != "true" ) {
            methods.fixedValue(selectedElement, e.target.offsetParent);
          } else if ( parentElement.Contents.find(attachedHandler.eHandler.id).length == 0 ) {
            selectedElement = $(e.target);
            methods.attachHandler(selectedElement, e.target.offsetParent);
          } else if (!resizingStatus) {
            selectedElement = $(e.target);
            methods.positionHandler(selectedElement);
          }
        }
      });
    });
  };
})(jQuery);
