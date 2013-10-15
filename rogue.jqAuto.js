/*
 JQAuto object to extend functionality of native jQueryUI autocomplete.
 Includes options and functions to replace Telerik.RadCombo object
 */
(function ($, undefined) {
    $.widget("rogue.jqauto", $.ui.autocomplete, {
        //don't create an options object in this script
        _cache: {},
        _acValue: '',
        _acText: '',
        _selectedItem: null,
        _tempItemCache: {},
        _matchedItems: [],
        options: $.extend({}, $.ui.autocomplete.prototype.options, {
            url: '', //The url of the service to get data
            buildUrl: null, // in case you want to vary the URL dynamically, set a function here to build it
            dataParams: null, //array of params that get sent with the request
            getpost: 'POST', //get or post, defaulted to POST
            valueFieldName: '',
            textFieldName: '',
            addlFieldName: '',
            defaultValue: null,
            defaultText: null,
            inputwidth: 150,
            inputheight: 20,
            termcache: false,
            jsonRoot: 't',
            autoSelectSingleOption: false,
            itemClickedCallback: null,
            dropDownWidth: 'auto',
            showDropDownArrow: false,
            disableIfNoData: true,
            ajaxOptions: {
                async: false,
                cache: false,
                dataType: 'json',
                contentType: 'application/json; charset=utf-8'
            }
        }),
        _create: function () {
            var self = this, tfn = self.options.textFieldName, localcache = self._cache, usecache = self.options.termcache,
                vfn = self.options.valueFieldName, afn = self.options.addlFieldName, validateit = true;

            self.element.css("width", self.options.inputwidth);
            self.element.css("height", self.options.inputheight).tooltip();
            self.element.addClass("ui-widget");
            //This was a bad idea, but left here as an example
            //of tapping into the keypress event if needed
            //self.element.on("keypress", function () { self._matchedItems = []; });
            self.options.source = function (request, response) {
                var term = request.term;
                if (self.options.termcache) {
                    if (term in localcache) {
                        response(localcache[term]);
                        return;
                    }
                }
                //if there is a URL, handle the ajax request
                if (self.options.url || self.options.buildUrl) {
                    //this is in here to support debugging in VS when
                    //debug port != the port where the service is listening
                    $.support.cors = true;
                    if (self.options.buildUrl) {
                        self.options.url = self.options.buildUrl.call(self, self);
                    }
                    //to support simple q= get scenario
                    if (self.options.getpost === "GET" && self.options.url.indexOf('http') > 0) {
                        if (self.options.url.slice(-1) != '?') self.options.url += '?';
                        self.options.url = self.options.url.substring(0, self.options.url.indexOf('?') + 1);
                        self.options.url += 'q=' + request.term;
                    }
                    $.ajax({
                        async: self.options.ajaxOptions.async,
                        cache: self.options.ajaxOptions.cache,
                        url: self.options.url,
                        data: self.options.dataParams,
                        dataType: self.options.ajaxOptions.dataType,
                        type: self.options.getpost,
                        contentType: self.options.ajaxOptions.contentType,
                        //not needed at this point
                        //dataFilter: function (data) { return data; },
                        error: function (jqXHR, textStatus, errorThrown) { alert('Error in data retrieval ' + errorThrown); self.element.removeClass("ui-autocomplete-loading"); debugger; },
                        success: function (data) {
                            var jdata = '';
                            if (typeof data === "undefined" || data === null) {
                                self.element.removeClass("ui-autocomplete-loading");
                                if (self.options.disableIfNoData) {
                                    self.element.addClass("ui-state-disabled");
                                }
                                return;
                            }
                            //if the data is coming back from an asmx, it will likely have a
                            //data.d before the json root
                            if (data.d) {
                                try {
                                    jdata = $.parseJSON(data.d);
                                }
                                catch (e) {
                                    alert('Data is not valid JSON\n' + e.Description);
                                }
                            }
                            else {
                                try {
                                    jdata = $.parseJSON(data);
                                }
                                catch (e) {
                                    alert('Data is not valid JSON\n' + e.Description);
                                }
                            }
                            // Check for empty object
                            if ($.isEmptyObject(jdata)) {
                                if (self.options.disableIfNoData) {
                                    self.element.addClass("ui-state-disabled");
                                }
                                return;
                            }
                            self.element.removeClass("ui-state-disabled");
                            //setup the mapping of the items through the function that
                            //highlights the matching text and creates the matchedItems
                            //array
                            var items = $.map(jdata[self.options.jsonRoot], function (item) {
                                return {
                                    label: self.__highlight(item[tfn], request.term),
                                    value: item[tfn],
                                    result: item[vfn],
                                    extra: item[afn]
                                };
                            });
                            //array of non-html items
                            self._tempItemCache = $.map(jdata[self.options.jsonRoot], function (item) {
                                return {
                                    label: item[tfn],
                                    value: item[tfn],
                                    result: item[vfn],
                                    extra: item[afn]
                                };
                            });
                            //only cache if the search term is > 2 chars and usecache = true
                            if (usecache && term.length > 2) {
                                localcache[term] = items;
                            }
                            //manage the matchedItems array to simulate the type down
                            //effect of an autocomplete using standard functionality
                            self._matchedItems = [];
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].label.indexOf('<strong>') > -1) {
                                    self._matchedItems.push(items[i]);
                                }
                            }
                            if (self._matchedItems && self._matchedItems.length > 0) {
                                items = self._matchedItems;
                            }

                            //We're down to only one logical match so autofill the 
                            //textbox and set the selectedItem to that item
                            if (self._matchedItems.length == 1) {
                                self.element.val(self._matchedItems[0].value);
                                //self.options.autoFocus = true;
                                self.__setSelectedItem(self._matchedItems[0]);
                                validateit = false;
                            }
                            response(items);
                        }
                    });
                }
            };
            this.options.select = function (event, ui) {
                event.preventDefault();
                self.__setSelectedItem(ui.item);
                if (!self.options.addlFieldName) {
                    self.element.val(ui.item.value).trigger('change');
                }
                else {
                    self.element.val(ui.item.extra).trigger('change');
                }
                self._acValue = ui.item.result;
                self._acText = ui.item.value;
                if (self.options.itemClickedCallback) {
                    self.options.itemClickedCallback.call(self);
                }
            };
            this.options.search = function (event, ui) {
                self.element.addClass("ui-autocomplete-loading");
            };
            this.options.close = function () {
                self.element.removeClass("ui-autocomplete-loading");
            };
            this.options.open = function () {
                $(".ui-autocomplete").css('width', self.options.dropDownWidth);
            };
            this.options.change = function (event, ui) {
                //if (ui.item != null && validateit) {
                self._removeIfInvalid(event, ui);
                //}
                if (ui === null && !validateit) {
                    self._close();
                }
                if (ui.item != null) {
                    self.__setSelectedItem(ui.item);
                }

                self._close();
            };
            this.element.on("dblclick", function () { self.element.select(); self._search(" "); });
            this._super("_create");
            this._focusable(this.element);

            //if async is true, this won't work
            //Gets all the values and sets the default text based on matching
            //Will be expensive for large lists
            if (self.options.defaultText && self.element.val() == '') {
                self.element.val(self.options.defaultText);
                self._search(self.options.defaultText);
                //check to see if we have a perfect match
                var t = self.__getLabelMatch();
                if (t) {
                    self.__setSelectedItem(t);

                }
                else {
                    //$.error("Default Text not found in list");
                    self.element.addClass("ui-state-error").attr("title", "Invalid Data");
                }
                self._close();
            }
            //Method to check for setting the values based upon a defaultValue
            if (self.options.defaultValue && self.element.val() == '') {
                self._search(" ");
                var t = self.__getValueMatch();
                if (t) {
                    self.__setSelectedItem(t);

                }
                else {
                    //$.error("Default Value not found in list");
                    self.element.addClass("ui-state-error").attr("title", "Invalid Data");
                }
                self._close();
            }
            //Method to handle selecting the only option if there is only one
            if (self.options.autoSelectSingleOption) {
                this.element.focus(function () {
                    self._search(" ");
                    if (self._tempItemCache.length === 1) {
                        self.__setSelectedItem(self._tempItemCache[0]);
                        if (self.options.itemClickedCallback) {
                            self.options.itemClickedCallback.call(self);
                        }
                    }
                    self._close();
                });
            }
            if (self.options.showDropDownArrow) {
                self.__createDropDownArrow();
            }
        },
        _destroy: function () {
            this._super("_destroy");
        },
        __highlight: function (s, t) {
            var matcher = new RegExp("(" + $.ui.autocomplete.escapeRegex(t) + ")", "ig");
            return s.replace(matcher, "<strong>$1</strong>");
        },
        _renderItem: function (ul, item) {
            return $("<li></li>")
                .data("item.autocomplete", item)
                .append($("<a></a>").html(item.label).on("click", function () { self._acValue = item.result; self._acText = item.value; }))
                .appendTo(ul);
        },
        __getLabelMatch: function () {
            var value = this.element.val(),
                valueLowerCase = value.toString().toLowerCase(), ropts = this._tempItemCache, i, a, b;
            for (i = 0; i < ropts.length; i++) {
                a = $.trim(ropts[i].label.toLowerCase());
                b = $.trim(valueLowerCase);
                if (a === b) return ropts[i];
            }
            return false;
        },
        __getValueMatch: function () {
            var value = this.options.defaultValue,
                valueLowerCase = value.toString().toLowerCase(), ropts = this._tempItemCache, i, a, b;
            for (i = 0; i < ropts.length; i++) {
                a = $.trim(ropts[i].result.toLowerCase());
                b = $.trim(valueLowerCase);
                if (a === b) return ropts[i];
            }
            return false;
        },
        _removeIfInvalid: function (event, ui) {

            // Selected an item, nothing to do
            if (ui.item) {
                return;
            }
            var ropts = this._tempItemCache;
            // Search for a match (case-insensitive)
            var value = this.element.val(),
                valueLowerCase = value.toLowerCase(),
                valid = false;
            for (var v = 0; v < ropts.length; v++) {
                if (ropts[v]['label'].toLowerCase() === valueLowerCase) {
                    valid = true;
                    return false;
                }
            }
            if (this.options.addlFieldName.length > 1) {
                for (v = 0; v < ropts.length; v++) {
                    if (ropts[v]['extra'].toLowerCase() === valueLowerCase) {
                        valid = true;
                        return false;
                    }
                }
            }
            // Found a match, nothing to do
            if (valid) {
                return;
            }

            // Remove invalid value
            this.element
                .val(this._acText || '').data('value', this._acValue || '')
                .attr("title", value + " didn't match any item")
                .addClass('ui-state-error')
                .tooltip("open")
                .focus()
                .select();

            this._delay(function () {
                this.element.tooltip("close").attr("title", "").removeClass('ui-state-error');
            }, 1500);

        },
        __setSelectedItem: function (item) {
            try {
                if (item) {
                    this._selectedItem = item;
                    this._acValue = item.result;
                    this._acText = item.value;
                    if (this.options.addlFieldName.length > 0) {
                        this.element.val(item.extra);
                    }
                    else {
                        this.element.val(this._acText);
                    }
                    this.element.data("value", item.result);
                }
                else {
                    var value = this.element.val();
                    this.element.attr("title", value + " didn't match any item")
                        .addClass('ui-state-error').val(this._acText)
                        .tooltip("open");
                    this._delay(function () {
                        this.element.tooltip("close").attr("title", "").removeClass('ui-state-error');
                    }, 2500);
                    return false;
                }
            }
            catch (e) {
                alert("Error attempting to set selected item: " + e.Description + '\n' + e.get_StackTrace());
            }
        },
        __createDropDownArrow: function () {
            var input = this.element, t = this, wasOpen = false;

            input.addClass("ui-widget ui-widget-content ui-state-default ui-corner-left")
                .css("margin", 0)
                .css("padding", "0.3em");

            this.wrapper = $('<span>').css("position", "relative").css("display", "inline-block").insertAfter(input);
            input.appendTo(this.wrapper);
            $("<a>")
                .attr("tabIndex", -1)
                //.attr("title", "Show All Items")
                .tooltip()
                .appendTo(this.wrapper)
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass("ui-corner-all")
                .css({ "position": "absolute", "top": 0, "bottom": 0, "margin-left": "-1px", "padding": 0 })
                .addClass("ui-corner-right")
                .mousedown(function () {
                    wasOpen = t.widget().is(":visible");
                })
                .click(function () {
                    input.focus();

                    // Close if already visible
                    if (wasOpen) {
                        return;
                    }
                    t.options.dropDownWidth = t.wrapper.width();
                    // Pass empty string as value to search for, displaying all results
                    t._search("");
                });

        },
        value: function (x) {
            if (!x) {
                return this._acValue;
            }
            else {
                this._acValue = x;
            }
        },
        label: function (x) {
            if (!x) {
                return this._acText;
            }
            else {
                this._acText = x;
            }
        },
        getInputElement: function () {
            return this.element;
        },
        getSelectedItem: function () {
            return this._selectedItem;
        },
        getMatchedItems: function () {
            return this._matchedItems;
        },
        getAllItems: function () {
            return this._tempItemCache;
        }
    });
})(jQuery);