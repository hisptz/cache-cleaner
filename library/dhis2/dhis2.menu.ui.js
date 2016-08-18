"use strict";
/*
 * Copyright (c) 2004-2014, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * Neither the name of the HISP project nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * Created by Mark Polak on 28/01/14.
 */
(function (dhis2menu, settings, undefined) {

    var jqLite = undefined, //Local jQuery variable to use for checking dependencies and switching jqLite and jQuery
        templates = {},
        cssDefaults = {},
        getBaseUrl = dhis2.settings.getBaseUrl = (function () {
            var href;

            //Add window.location.origin for IE8
            if (!window.location.origin) {
                window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
            }

            href = window.location.origin;

            return function () {
                var urlParts = href.split("/"),
                    baseUrl;

                if (settings.baseUrl === undefined) {
                    return "..";
                }

                if (typeof settings.baseUrl !== "string") {
                    throw new TypeError("Dhis2 settings: baseUrl should be a string");
                }

                //Check if there is a filename at the end of the current url
                //if so remove it and join the parts else just join the href and the base url
                if (urlParts[urlParts.length - 1] === "") {
                    urlParts.pop();
                    urlParts.push(dhis2.settings.baseUrl);
                    baseUrl = urlParts.join('/');
                } else {
                    baseUrl = [href, dhis2.settings.baseUrl].join('/');
                }
                return baseUrl;
            }
        })();

    cssDefaults = {
        ulWrapId: "menuLinkArea",
        aMenuLinkClasses: "menu-link drop-down-menu-link"
    };

    templates.itemItemplate = '' +
        '<li data-id="{{id}}" data-app-name="{{name}}" data-app-action="{{baseUrl}}{{defaultAction}}">' +
        '<a href="{{baseUrl}}{{defaultAction}}" class="app-menu-item">' +
        '<img src="{{baseUrl}}{{icon}}" onError="javascript: this.onerror=null; this.src = \'' + getBaseUrl() + '/icons/program.png\';">' +
        '<span>{{name}}</span>' +
        '<div class="app-menu-item-description"><span class="bold">{{name}} {{id}}</span><i class="fa fa-arrows"></i><p>{{description}}</p></div>' +
        '</a>' +
        '</li>';


    templates.menuLink = '<li id="{{id}}Button">' +
        '<a id="{{id}}Link" class="{{classes}}"><i class="fa fa-{{iconName}}"></i>{{menuItemName}}</a>' +
        '<div class="app-menu-dropdown-wrap">' +
        '<div class="app-menu-dropdown">' +
        '<div class="caret-up-border"></div><div class="caret-up-background"></div>' +
        '<ul class="menuDropDownBox">{{menuItems}}</ul>' +
        '<div class="menu-drop-down-buttons"></div>' +
        '</div>' +
        '</div>' +
        '</li>';

    templates.menuLinkWithScroll = '<li id="{{id}}Button">' +
        '<a id="{{id}}Link" class="{{classes}}"><i class="fa fa-{{iconName}}"></i>{{menuItemName}}</a>' +
        '<div class="app-menu-dropdown-wrap">' +
        '<div class="app-menu-dropdown">' +
        '<div class="caret-up-border"></div><div class="caret-up-background"></div>' +
        '<div class="menu-drop-down-wrap">' +
        '<div class="menu-drop-down-scroll">' +
        '<ul class="menuDropDownBox">{{menuItems}}</ul>' +
        '</div>' +
        '</div>' +
        '<div class="menu-drop-down-buttons">' +
        '<div class="apps-menu-bottom-button apps-scroll apps-scroll-up"><a class="fa fa-caret-up" href="#"></a></div>' +
        '<div class="apps-menu-bottom-button apps-scroll apps-scroll-down"><a class="fa fa-caret-down" href="#"></a></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</li>';

    templates.search = '<div class="apps-search-wrap">' +
        '<input class="apps-search" type="text" placeholder="{{search_apps}}">' +
        '<i class="apps-search-clear fa fa-times-circle"></i>' +
        '</div>';

    templates.extraLink = '<div class="apps-menu-bottom-button apps-menu-more"><a href="{{url}}">{{text}}</a></div>';
    var template, defaultMenuUi, searchUi, linkButtonUi, scrollUi, shortCutUi, keys;

    keys = {
        ctrl: 17,
        enter: 13,
        slash: 191,
        backslash: 220,
        arrowLeft: 37,
        arrowUp: 38,
        arrowRight: 39,
        arrowDown: 40,
        m: 77,
        comma: 188,
        dot: 190,
        isArrowKey: function (keyCode) {
            return (keyCode === keys.arrowRight ||
            keyCode === keys.arrowLeft ||
            keyCode === keys.arrowDown ||
            keyCode === keys.arrowUp);
        }
    };

    /*
     * Check for what type of jquery/jqLite we are using and assign it to jqLite.
     * We name it jqLite so that whoever maintains this code is not confused by the selectors available
     * Please note that this jqLite is the angular version of jqLite and this does not contain the full jqLite api but
     * is a subset of.
     *
     * @see https://docs.angularjs.org/api/ng/function/angular.element
     */
    if (typeof angular !== 'undefined') {
        jqLite = angular.element;
    } else {
        if (typeof jQuery !== 'undefined') {
            jqLite = jQuery;
        }
    }

    /**
     * Utility function to check if an object is a function
     *
     * @param obj Value that should be checked
     * @returns {boolean} Returns true when the passed object is a function
     */
    function isFunction(obj) {
        return Object.prototype.toString.call(obj) == '[object Function]';
    }

    /**
     * Load data from a dataUrl and return the modules that were found in that response
     * Fires a http request for json content and takes the {modules} parameter from the returned json object
     *
     * @param {String} dataUrl Url of the data to be requested
     * @param {Function} callback Callback to be fired when the data is recieved
     * @param {Object} extra Extra information that gets passed to the callback function
     *                       along side of the modules that are found.
     */
    function loadDataFromUrl(dataUrl, callback, extra) {
        var http, url;

        http = new XMLHttpRequest();
        url = getBaseUrl() + dataUrl;

        http.open("GET", url, true);

        //Send the proper header information along with the request
        http.setRequestHeader("Content-type", "application/json; charset=utf-8");

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                if (typeof callback === 'function') {
                    //dhis2.menuModels = function(){
                    //    return JSON.parse(http.responseText).modules;
                    //}
                    callback(JSON.parse(http.responseText).modules, extra);
                }
            } else {
                /*
                 //TODO: Give user feedback for failure to load items
                 //TODO: Translate this error message
                 var error_template = '<li class="app-menu-error"><a href="' + window.location.href +'">Unable to load your apps, click to refresh</a></li>';
                 $('#' + selector).addClass('app-menu').html('<ul>' + error_template + '</ul>');
                 $('#appsDropDown .menuDropDownBox').html(error_template);
                 */
            }
        };
        http.send();
    }

    /**
     * Creates a template object with methods to find and parse templates. This is
     * used for managing menu templates within the various menu addons.
     *
     * @param templates
     * @returns {}
     */
    template = function (templates) {
        var template = {};

        if (templates === undefined)
            templates = {};

        function findTemplateByName(templateName) {
            if (templates[templateName])
                return templates[templateName];

            //Throw error when template does not exist
            console.error("Template with name: " + templateName + " does not exist");
        }

        /**
         * Parses a template
         *
         * @param {String} templateName The name of the template to be parsed
         * @param {Object} data This is an object that holds the data to be placed into the placeholders
         * @returns {String} Parsed template
         */
        template.parse = function (templateName, data) {
            var regex = /\{\{([A-z]+?)\}\}/,
                match,
                template = findTemplateByName(templateName);

            while(match = regex.exec(template)) {
                template = template.replace('{{' + match[1] + '}}', data[match[1]] || '');
            }

            return template;
        };

        /**
         * Gets a "raw" template. This returns the template as it was saved, without parsing it.
         * @param {String} name The name of the template
         * @returns {String}
         */
        template.get = function (name) {
            if (templates[name] === undefined) {
                console.error("Template " + name + " does not exist");
            }
            return templates[name];
        };

        /**
         * Adds a template to the template cache
         *
         * A Template may contain placeholders. These placeholders are replaced with values when
         * the template is parsed.
         *
         * Place holders are defined between double curly brackets like for example {{id}}.
         * When parsing a template with this place holder the parse method will take the "id" property
         * from the data object and place it instead of the placeholder.
         *
         * @param {String} name The name of the template, and how to identify it
         * @param {String} template The template itself (This can be any type of string/html, possibly with placeholders)
         */
        template.add = function (name, template) {
            if (templates[name]) {
                console.error("Template not allowed to be overridden using the add method, use the replace method instead");
            }
            templates[name] = template;
        };

        /**
         * Replace an already existing template with a different one
         *
         * @param {String} name The name of the template, and how to identify it
         * @param {String} template The template itself (This can be any type of string/html, possibly with placeholders)
         */
        template.replace = function (name, template) {
            if (templates[name] === undefined) {
                console.error("No template to be replaced, use the add method to add templates")
            }
            templates[name] = template;
        };

        return template;
    };

    /**
     * Creates an error object with that has the passed in message
     *
     * @param message
     * @returns {MenuError}
     * @constructor
     */
    function MenuError (message) {
        var MenuError = function () {},
            error;

        MenuError.prototype = new Error;

        error = new MenuError();

        error.message = message;

        error.toString = function () {
            return "MenuError: " + this.message + " \n";
        };

        return error;
    }

    /**
     * Creates a menu object with the menuBase as a prototype
     *
     * @param menuBase
     * @returns {Menu}
     */
    function createMenu (menuBase) {
        var Menu = function () {},
            menu;

        /**
         * When the function is called with an empty menuBase
         * we create a default menuBase with some essential variables
         */
        if (menuBase === undefined) {
            menuBase = {
                renderers: [],
                eventsHandlers: [],
                name: "",
                hooks: {
                    open: [],
                    close: []
                }
            };
            menuBase.hooks.call = function (name) {
                if (menuBase.hooks[name]) {
                    menuBase.hooks[name].forEach(function (callback) {
                        if (isFunction(callback)) {
                            callback.apply(name);
                        }
                    });
                }
            }
        }

        Menu.prototype = menuBase;
        menu =  new Menu();

        //TODO: Render function now gets added to all objects (Preferably we only need one)
        menu.render = function (menuItems) {
            jqLite(document).ready(function () {
                menuBase.renderers.forEach(function (renderFunction) {
                    if (isFunction(renderFunction)) {
                        renderFunction(menuItems);
                    }
                });
                //Add the event handlers only once
                menuBase.eventsHandlers.forEach(function (eventFunction) {
                    if (isFunction(eventFunction)) {
                        eventFunction(document.querySelector('#' + menu.name + "Button"));
                    }
                });
            });
        };

        return menu;
    }

    /**
     * Menu with default functionality
     *
     * @returns {Menu}
     */
    defaultMenuUi = function (name, data, icon, container) {
        var defaultMenu = createMenu(),
            currentSelectedId = undefined;

        defaultMenu.template = template();

        defaultMenu.name = name;
        defaultMenu.ajax = false;
        defaultMenu.icon = icon;
        defaultMenu.container = container;

        if (typeof data === "string") {
            //TODO: Implement this
            loadDataFromUrl(data, function (data) {
                defaultMenu.menuItems.addMenuItems(data)
            });
            defaultMenu.menuItems = dhis2.menu(name);
        } else {
            defaultMenu.menuItems = dhis2.menu(name, data);
        }

        defaultMenu.template.add('menuStructure', '<ul id="{{id}}"></ul>');
        defaultMenu.template.add('linkItem', templates.menuLink);
        defaultMenu.template.add('menuItem', templates.itemItemplate);

        defaultMenu.isOpen = function () {
            var dropdownElement = jqLite(document.querySelector(defaultMenu.getDropdownSelector())),
                display = jqLite(dropdownElement).css("display"),
                outOfView = parseInt(jqLite(dropdownElement).css("left"), 10) < 0; //TODO: This is a kind of funky check

            if (display === 'none' || outOfView) {
                return false;
            }
            return true;
        };

        defaultMenu.isClosed = function () {
            return ! defaultMenu.isOpen();
        };

        defaultMenu.open = function (hover) {
            var dropdownElement = jqLite(document.querySelector(defaultMenu.getDropdownSelector()));

            //Set the dropdown position
            jqLite(dropdownElement).css('left', defaultMenu.getDropDownPosition() + 'px');
            dropdownElement.css('display', 'block');

            if (! hover) {
                dropdownElement.attr("data-display-clicked", "true");
            }
            defaultMenu.hooks.call('open');
        };

        defaultMenu.close = function (hover) {
            var dropdownElement = jqLite(document.querySelector(defaultMenu.getDropdownSelector()));

            dropdownElement.css('display', 'none');
            if ( ! hover) {
                dropdownElement.attr("data-display-clicked", "false");
            }
            defaultMenu.hooks.call('close');
        };

        defaultMenu.closeAll = function () {
            var menuDropDowns = document.querySelectorAll("#" + defaultMenu.container + " div.app-menu-dropdown-wrap");
            jqLite(menuDropDowns).css('display', 'none');
            jqLite(menuDropDowns).attr("data-display-clicked", "false");
        };

        defaultMenu.setCurrentId = function (id) {
            currentSelectedId = id;
        };

        defaultMenu.getCurrentId = function () {
            return currentSelectedId;
        };

        defaultMenu.goToMenuItem = function (menuElement) {
            var link, url;

            if (menuElement === undefined)
                return;

            link = menuElement.querySelector('a');
            url = jqLite(link).attr('href');

            //TODO: Check if it is an actual url?
            if (url) {
                window.location = url;
            }
        };

        defaultMenu.renderMenuItems = function (menuItems) {
            var result = '';
            //Parse item template once for each of the menu items
            menuItems.forEach(function (menuItem) {
                result += defaultMenu.template.parse('menuItem', {
                    "id": menuItem.id,
                    "name": menuItem.name,
                    "defaultAction": menuItem.defaultAction,
                    "icon": menuItem.icon
                });
            });
            return result;
        };

        defaultMenu.getButtonId = function () {
            return "#" + defaultMenu.name + "Button";
        };

        defaultMenu.getDropdownSelector = function () {
            return defaultMenu.getButtonId() + " div.app-menu-dropdown-wrap";
        };

        defaultMenu.getDropDownPosition = function () {
            var menuElement = document.querySelector(defaultMenu.getButtonId()),
                dropdownElement = jqLite(menuElement.querySelector("div.app-menu-dropdown-wrap")),
                dropdownPosition;

            dropdownElement.css('display', 'block');

            // Get the dropdown width and position
            defaultMenu.dropdownWidth = dropdownElement[0].offsetWidth;
            defaultMenu.linkPositionX = menuElement.offsetLeft;

            // Calculate the dropdown position x
            dropdownPosition = defaultMenu.linkPositionX - (defaultMenu.dropdownWidth - menuElement.offsetWidth);

            //Hide the dropdown element
            dropdownElement.css('display', 'none');

            return dropdownPosition;
        };

        defaultMenu.renderers.push(function (menuData) {
            var linkItem, menuItems;

            menuItems = defaultMenu.renderMenuItems(menuData.getApps());

            //Build the menu item and dropdown
            linkItem = defaultMenu.template.parse('linkItem', {
                "id": defaultMenu.name,
                "iconName": defaultMenu.icon,
                "menuItemName": menuData.name,
                "classes": cssDefaults.aMenuLinkClasses,
                "menuItems": menuItems
            });

            //Create menu wrapper if it does not exist
            if (document.querySelector('#' + defaultMenu.container + ' ul') === null) {
                jqLite(document.querySelector('#' + defaultMenu.container)).append(
                    defaultMenu.template.parse('menuStructure', {"id": cssDefaults.ulWrapId})
                )
            }

            //Add the linkItem to the menu
            //Make sure that the application button element is always positioned after the profile
            if (document.querySelector('#applicationsButton') !== null) {
                jqLite(document.querySelector('#applicationsButton')).before(linkItem);
            } else {
                jqLite(document.querySelector('#' + defaultMenu.container + ' ul')).append(linkItem);
            }
        });

        defaultMenu.eventsHandlers.push(function (menuElement) {
            var dropdownElement = jqLite(menuElement.querySelector("div.app-menu-dropdown-wrap"));

            //Add click to show dropdown event
            jqLite(menuElement.querySelector("a.drop-down-menu-link")).on("click", function () {
                if (dropdownElement.attr("data-display-clicked") === "true") {
                    defaultMenu.close();
                } else {
                    defaultMenu.closeAll();
                    defaultMenu.open();
                }
            });

            //Hover event
            jqLite(menuElement).on('mouseenter', function() {
                defaultMenu.open(true);
            });
            jqLite(menuElement).on('mouseleave', function() {
                if (dropdownElement.attr('data-display-clicked') === "true") {
                    return;
                }
                defaultMenu.close(true);
            });

            jqLite(window).on('resize', function () {
                defaultMenu.closeAll();
            });
        });

        defaultMenu.menuItems.subscribe(defaultMenu.render, true);
        defaultMenu.menuItems.subscribe(function (menu) {
            var menuElementList = document.querySelector(defaultMenu.getButtonId() + " ul.menuDropDownBox"),
                menuItemsHtml;

            if (menuElementList === null)
                return;

            menuItemsHtml = defaultMenu.renderMenuItems(menu.getApps());

            jqLite(menuElementList.querySelectorAll("li")).remove();
            jqLite(menuElementList).append(menuItemsHtml);
            defaultMenu.setCurrentId(undefined);
        });

        return createMenu(defaultMenu);
    };

    scrollUi = function (menu) {
        var scrollMenu = menu;

        scrollMenu.template.replace('linkItem', templates.menuLinkWithScroll);

        scrollMenu.eventsHandlers.push(function (menuElement) {
            var scrollElement = menuElement.querySelector('div.menu-drop-down-scroll'),
                scrollUpElement = menuElement.querySelector('div.apps-scroll-up'),
                scrollDownElement = menuElement.querySelector('div.apps-scroll-down');

            jqLite(scrollElement).on('scroll', function () {
                if (scrollElement.scrollTop < 10) {
                    scrollMenu.menuWidth = 360;
                } else {
                    scrollMenu.menuWidth = 384;
                }
                jqLite(scrollElement).parent().css('width', scrollMenu.menuWidth + 'px');
                jqLite(scrollElement).parent().parent().css('width',scrollMenu.menuWidth + 'px');
            });

            jqLite(scrollUpElement).on('click', function (event) {
                event.preventDefault();
                scrollElement.scrollTop = scrollElement.scrollTop - 330;
            });

            jqLite(scrollDownElement).on('click', function (event) {
                var scrollDistance = 330;
                event.preventDefault();

                //TODO: We should only have to do this when there is a scrollbar
                //Compensate on first scroll for searchbar
                if (scrollElement.scrollTop === 0) {
                    scrollDistance += 40;
                }

                scrollElement.scrollTop = scrollElement.scrollTop + scrollDistance;
            });
        });

        return createMenu(scrollMenu);
    };

    /**
     * Adds search functionality to the passed menu
     *
     * @param menu
     * @returns {Menu}
     */
    searchUi = function (menu) {
        var searchMenu = menu,
            rendered = false,
            searchAppsText = '';

        function performSearch(menuElement) {
            var menuItemsHtml,
                searchFor = jqLite(menuElement.querySelector(".apps-search")).val().toLowerCase(),
                searchMatches,
                menuElementList = menuElement.querySelector('ul.menuDropDownBox');

            if (searchFor === '') {
                jqLite(menuElement.querySelector(".apps-search-clear")).css("display", "none");
                menuElement.querySelector(".apps-search").focus();
                menuItemsHtml = searchMenu.renderMenuItems(searchMenu.menuItems.getApps());
            } else {
                jqLite(menuElement.querySelector(".apps-search-clear")).css("display", "block");
                searchMatches = searchMenu.menuItems.search(searchFor);
                menuItemsHtml = searchMenu.renderMenuItems(searchMatches);
            }

            jqLite(menuElementList.querySelectorAll('li')).remove();
            jqLite(menuElementList).append(menuItemsHtml);
            searchMenu.setCurrentId(undefined);
        }

        searchMenu.template.add('search', templates.search);

        //Translate the search apps name
        dhis2.translate.get(['app_search_placeholder'], function (translations) {
            var searchBoxElement = document.querySelector('#' + searchMenu.name + "Button input.apps-search");

            searchAppsText = translations.get('app_search_placeholder');
            if (rendered === true) {
                jqLite(searchBoxElement).attr('placeholder', searchAppsText);
            }
        });

        searchMenu.renderers.push(function () {
            var dropdownWrap = document.querySelector('#' + searchMenu.name + "Button div.menu-drop-down-scroll");
            jqLite(dropdownWrap).prepend(searchMenu.template.parse('search', { search_apps: searchAppsText }));
            rendered = true;
        });

        searchMenu.eventsHandlers.push(function (menuElement) {
            var searchBoxElement = menuElement.querySelector("input.apps-search");

            searchMenu.hooks.open.push(function () {
                searchBoxElement.focus();
            });

            jqLite(searchBoxElement).on('keyup', function (event) {
                //Filter the menu items
                if ( ! keys.isArrowKey(event.which) &&
                    ! (event.which === keys.enter) &&
                    ! (event.which === keys.ctrl)) {
                    performSearch(menuElement);
                }
            });

            jqLite(menuElement.querySelector(".apps-search-clear")).on('click', function () {
                jqLite(menuElement.querySelector(".apps-search-clear")).css("display", "none");
                jqLite(menuElement.querySelector(".apps-search")).val("");
                menuElement.querySelector(".apps-search").focus();
                performSearch(menuElement);
            });
        });

        return createMenu(searchMenu);
    };

    linkButtonUi = function (menu) {
        var linkButtonMenu = menu,
            rendered = false;

        linkButtonMenu.template.add('extraLink', templates.extraLink);

        //Translate the link name
        dhis2.translate.get([menu.extraLink.text], function (translations) {
            menu.extraLink.text = translations.get(menu.extraLink.text);
            if (rendered === true) {
                //TODO change the class of this button to make it more general
                jqLite(document.querySelector('#' + linkButtonMenu.name + 'div.apps-menu-bottom-button')).html(menu.extraLink.text);
            }
        });

        linkButtonMenu.renderers.push(function () {
            var buttonContainer = document.querySelector('#' + linkButtonMenu.name + "Button div.menu-drop-down-buttons");
            menu.extraLink.url = dhis2.menu.fixUrlIfNeeded(menu.extraLink.url);
            jqLite(buttonContainer).prepend(linkButtonMenu.template.parse('extraLink', menu.extraLink));
            rendered = true;
        });

        return createMenu(linkButtonMenu);
    };

    shortCutUi = function (menu) {
        var shortCutMenu = menu;

        shortCutMenu.eventsHandlers.push(function (menuElement) {
            var currentElement,
                shortCutElements,
                oldFocusedElement;

            function changeCurrentSelected(currentElement) {

                function scrollTo(element, to, duration) {
                    var difference, perTick;

                    if (duration <= 0) return;

                    difference = to - element.scrollTop - 49;
                    perTick = difference / duration * 10;

                    setTimeout(function () {
                        element.scrollTop = element.scrollTop + perTick;
                        if (element.scrollTop === to || perTick === Infinity) return;
                        scrollTo(element, to, (duration - 10));
                    }, 10);
                }

                jqLite(shortCutMenu.selectedElement).toggleClass("selected");
                shortCutMenu.selectedElement = shortCutElements[currentElement];
                jqLite(shortCutMenu.selectedElement).toggleClass("selected");

                if (menuElement.querySelector("div.menu-drop-down-scroll")) {
                    scrollTo(menuElement.querySelector("div.menu-drop-down-scroll"), shortCutMenu.selectedElement.offsetTop, 50);
                }

                shortCutMenu.setCurrentId(currentElement);
            }

            shortCutMenu.hooks.close.push(function () {
                shortCutMenu.setCurrentId(undefined);
            });

            jqLite(document).on("keyup", function (event) {
                /**
                 * Key combination using alt to control opening and closing
                 */
                if (event.which === shortCutMenu.shortCutKey && (event.ctrlKey || event.altKey)) {
                    event.preventDefault();

                    if (shortCutMenu.isOpen()) {
                        shortCutMenu.close();
                        if (oldFocusedElement)
                            oldFocusedElement.focus();
                    } else {
                        oldFocusedElement = document.activeElement;
                        document.activeElement.blur();

                        shortCutMenu.closeAll();
                        shortCutMenu.open();
                    }
                }
            });

            jqLite(menuElement.querySelectorAll('input')).on("keydown", function (event) {
                if (keys.isArrowKey(event.which)) {
                    return false;
                }
            });

            jqLite(document).on("keyup", function (event) {
                var goToElement;

                //Don't run anything when the menu is not open
                if (shortCutMenu.isClosed()) {
                    return;
                }

                //Prevent default behavior for any of the bound keys when the menu is open
                event.preventDefault();

                //Get the menu elements available on the dom
                shortCutElements = menuElement.querySelectorAll("ul.menuDropDownBox li");

                /**
                 * Movement keys
                 */
                if (keys.isArrowKey(event.which)) {
                    currentElement = shortCutMenu.getCurrentId();

                    event.preventDefault();

                    //When the first arrow button is pressed but there is no selected element use the first one
                    if (currentElement === undefined) {
                        currentElement = 0;
                        changeCurrentSelected(currentElement);
                        return;
                    }

                    if (event.which === keys.arrowRight) {
                        if (shortCutElements[currentElement + 1] === undefined) {
                            return;
                        }
                        currentElement = currentElement + 1;
                        changeCurrentSelected(currentElement);
                        return;
                    }

                    if (event.which === keys.arrowLeft) {
                        if (shortCutElements[currentElement - 1] === undefined) {
                            return;
                        }
                        currentElement = currentElement - 1;
                        changeCurrentSelected(currentElement);
                        return;
                    }

                    if (event.which === keys.arrowDown) {
                        if (shortCutElements[currentElement + 3] === undefined) {
                            return;
                        }
                        currentElement = currentElement + 3;
                        changeCurrentSelected(currentElement);
                        return;
                    }

                    //TODO: Clean up this code a bit as it's very confusing to what it does now.
                    if (event.which === keys.arrowUp) {
                        if (shortCutElements[currentElement - 3] === undefined) {
                            return;
                        }
                        currentElement = currentElement - 3;
                        changeCurrentSelected(currentElement);
                        return;
                    }
                }

                /**
                 * Key to go to the selected menu item if no item is selected go to the first one
                 */
                if (event.which === keys.enter) {
                    goToElement = shortCutElements[shortCutMenu.getCurrentId()];
                    if (goToElement === undefined) {
                        goToElement = shortCutElements[0];
                    }
                    shortCutMenu.goToMenuItem(goToElement);
                }
            });
        });

        return createMenu(shortCutMenu);
    };

    /*******************************************************************************************************************
     * Dhis2 menu ui functions
     ******************************************************************************************************************/

    /*
     * Create the object that we will expose (This gets attached onto the dhis2.menu global variable as dhis2.menu.ui
     * Generally one will use just the ui version but if there is a case where the ui does not need to be used a
     * different wrapper can be build around dhis2.menu as all the menu logic is contained in there and this ui wrapper
     * just creates an instance of the dhis2.menu object for each of the menus that are created.
     */
    dhis2menu.ui = {};
    dhis2menu.ui.createMenu = function (menuName, menuData, options) {
        var menu;

        if (typeof menuName !== "string")
            throw MenuError("Menu name needs to be a string");

        //menuData is not a string and does not have any items
        if (typeof menuData !== "string" && menuData.length <= 0) {
            throw MenuError("Menu should have data to present in an array or be a url to fetch data from");
        }

        //Sets default options if non have been given
        if (options == undefined)
            options = {};

        menu = defaultMenuUi(
            menuName,
            menuData,
            options['icon'] || 'th', //th is the default font-awesome icon we use for menus
            options['container'] || 'dhisDropDownMenu'); //dhisDropDownMenu is the default container for the menu

        if ( !! options['shortCut'] && keys[options['shortCut']]) {
            menu.shortCutKey = keys[options['shortCut']];
            menu = shortCutUi(menu);
        }

        if ( !! options['scrollable']) {
            menu = scrollUi(menu);
        }

        if ( !! options['scrollable'] && !! options['searchable']) {
            menu = searchUi(menu);
        }

        if (typeof options['extraLink'] === 'object' && options.extraLink['url'] && options.extraLink['text']) {
            menu.extraLink = options['extraLink'];
            menu = linkButtonUi(menu);
        }

        return menu;
    }

})(window.dhis2.menu = window.dhis2.menu || {}, dhis2.settings = dhis2.settings || {});

/**
 * End of menu ui code. The code below creates the menu with the default profile and apps menus
 */
(function () {
    var helpPageLink = "";

    dhis2.menu.ui.initMenu = function () {
        try {
            dhis2.menu.ui.loadingStatus = jQuery.ajax({
                type : "GET",
                url : dhis2.settings.getBaseUrl() + "/dhis-web-commons/menu/getHelpPageLinkModule.action",
                dataType : "json",
                success : function(json) {
                    helpPageLink = json;
                    bootstrapMenu();
                },
                error: function () {
                    bootstrapMenu();
                }
            });
        } catch (e) {
            if (console && console.error) {
                console.error(e.message, e.stack);
            }
        }
    };

    function bootstrapMenu() {
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        dhis2.menu.ui.createMenu("profile", [
                {
                    name: "settings",
                    namespace: "/dhis-web-commons-about",
                    defaultAction: "../dhis-web-commons-about/userSettings.action",
                    icon: "../icons/usersettings.png",
                    description: ""
                },
                {
                    name: "profile",
                    namespace: "/dhis-web-commons-about",
                    defaultAction: "../dhis-web-commons-about/showUpdateUserProfileForm.action",
                    icon: "../icons/function-profile.png",
                    description: ""
                },
                {
                    name: "account",
                    namespace: "/dhis-web-commons-about",
                    defaultAction: "../dhis-web-commons-about/showUpdateUserAccountForm.action",
                    icon: "../icons/function-account.png",
                    description: ""
                },
                {
                    name: "help",
                    namespace: "/dhis-web-commons-about",
                    defaultAction: helpPageLink.defaultAction || "", //FIXME: This sets the help url to an empty string when the ajax call failed. We should find an alternative.
                    icon: "../icons/function-account.png",
                    description: ""
                },
                {
                    name: "log_out",
                    namespace: "/dhis-web-commons-about",
                    defaultAction: "../dhis-web-commons-security/logout.action",
                    icon: "../icons/function-log-out.png",
                    description: ""
                },
                {
                    name: "about_dhis2",
                    namespace: "/dhis-web-commons-about",
                    defaultAction: "../dhis-web-commons-about/about.action",
                    icon: "../icons/function-about-dhis2.png",
                    description: ""
                }
            ],
            {
                icon: "user",
                shortCut: "comma"
            }
        );

        dhis2.menu.mainAppMenu = dhis2.menu.ui.createMenu("applications",
            "/dhis-web-commons/menu/getModules.action",
            {
                searchable: !isMobile,
                scrollable: true,
                extraLink: {
                    text: 'more_applications',
                    url: '../dhis-web-commons-about/modules.action'
                },
                shortCut: "m"
            }
        );


    }

    if (window['angular']) {

        /**
         * Angular directive for the menu.
         */
        angular.module('d2Menu', [])
            /**
             * The directive places a div element with the dhisDropDownMenu id and then calls the normal menu
             * init method to run all the normal javascript code.
             */
            .directive('d2Menu', [function () {
                return {
                    restrict: 'EA',
                    replace: true,
                    template: '<div id="dhisDropDownMenu"></div>',
                    //TODO: This might not be proper use of a controller
                    controller: function () {
                        dhis2.menu.ui.initMenu();
                    }
                }
            }])
            .directive('ardsMenu',[function(){
                return {
                    restrict: 'EA',
                    replace:true,
                    template:[
                        '<div class="row normal">',
                        '<nav class="topnav navbar-static-top navbar-inverse responsive" role="navigation">',
                        <!-- Brand and toggle get grouped for better mobile display -->
                        '<div class="navbar-header" style="background-color:#457B49;">',
                        '<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">',
                        '<span class="sr-only">Toggle navigation</span>',
                        '<span class="icon-bar"></span>',
                        '<span class="icon-bar"></span>',
                        '<span class="icon-bar"></span>',
                        '</button>',
                        '<a ng-if="menus[\'Home\']" class="navbar-brand" href="../api/apps/home/index.html" style="padding-left: 15px"><i class="fa fa-home"></i>ARDS</a>',
                        '</div>',

                        <!-- Collect the nav links, forms, and other content for toggling -->
                        '<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1" style="background-color:#457B49;">',
                        '<ul class="nav navbar-nav" style="background-color:#457B49" >',

                        '<li ng-if="menus[\'dhis-web-dashboard-integration\']"  style="border-right: solid 1px #888"><a id="menuLink5" href="../dhis-web-dashboard-integration/index.action" class="menuLink">Dashboard</a></li>',
                        '<li ng-if="menus[\'Reports App\']" style="border-right: solid 1px #888"><a  href="../api/apps/standardreport/index.html#/" class="menuLink">Report</a></li>',
                        '<li class="dropdown" style="border-right: solid 1px #888;">',
                        '<a  href="" class="dropdown-toggle" data-toggle="dropdown"class="menuLink"> Data <b class="caret"></b></a>',
                        '<ul class="dropdown-menu">',
                        '<li ng-if="menus[\'dhis-web-pivot\']" style="color:#ffffff!important;"><a href="../dhis-web-pivot/index.action" class="menuLink">Pivot table</a></li>',
                        '<li ng-if="menus[\'dhis-web-visualizer\']" style="color:#ffffff!important;"><a  href="../dhis-web-visualizer/index.action" class="menuLink">Data visualizer</a></li>',
                        '<li ng-if="menus[\'dhis-web-mapping\']" style="color:#ffffff!important;"><a  href="../dhis-web-mapping/index.action" class="menuLink">Map</a></li>',

                        '</ul>',
                        '</li>',
                        '<li ng-if="menus[\'News\']" style="border-right: solid 1px #888"><a href="../api/apps/news/index.html" class="menuLink">News</a></li>',
                        '<li  ng-if="menus[\'Article\']" style="border-right: solid 1px #888"><a href="../api/apps/articles/index.html" class="menuLink">Articles</a></li>',
                        '<li ng-if="menus[\'Ards Data entry\']" style="border-right: solid 1px #888;">',
                        '<a  href=""  class="dropdown-toggle" data-toggle="dropdown"class="menuLink">ARDS LGMD2<b class="caret"></b></a>',
                        '<ul class="dropdown-menu">',
                        '<li ng-if="menus[\'Ards Data entry\']" style="color:#ffffff!important;"><a href="../api/apps/ards-data-entry/index.html" >Data Entry&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-importexport\']" style="color:#ffffff!important;"><a href="../dhis-web-importexport/index.action" >Import Export&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-maintenance-dataadmin\']" style=" color:#ffffff!important;"><a href="../dhis-web-maintenance-dataadmin/optionSet.action"> Look up Table&nbsp;</a></li>',
                        '</ul>',
                        '</li>',
                        '<li ng-if="menus[\'dhis-web-maintenance-dataadmin\']" class="dropdown" style="border-right: solid 1px #888;">',
                        '<a href="" class="dropdown-toggle" data-toggle="dropdown"class="menuLink">Maintainance<b class="caret"></b></a>',
                        '<ul class="dropdown-menu" >',
                        '<li ng-if="menus[\'dhis-web-maintenance-dataadmin\']" style="color:#ffffff!important;"><a href="../dhis-web-maintenance-dataadmin/index.action" >Data Administration&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-maintenance\']" style="color:#ffffff!important;"><a href="../dhis-web-maintenance/" >Data Elements and Computed values&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-maintenance-dataset\']" style="color:#ffffff!important;"><a href="../dhis-web-maintenance-dataset/index.action" >Entry Form&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-maintenance-organisationunit\']" style="color:#ffffff!important;"><a href="../dhis-web-maintenance-organisationunit/index.action" >Administrative Units&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-settings\']" style="color:#ffffff!important;"><a href="../dhis-web-settings/" >Settings&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-maintenance-user\']" style="color:#ffffff!important;"><a href="../dhis-web-maintenance-user/index.action" >Users&nbsp;</a></li>',
                        '<li ng-if="menus[\'CMS\']" style="color:#ffffff!important;" class="cms"><a href="../api/apps/cms/index.html" id="cms_settings_button">CMS&nbsp;</a></li>',
                        '<li ng-if="menus[\'dhis-web-reporting\']" style="color:#ffffff!important;"><a href="../dhis-web-reporting/generateHtmlReport.action?uid=vDl5hipAW8w&" >System usage statistics&nbsp;</a></li>',
                        '</ul>',
                        '</li>',
                        '</ul>',
                        '<ul class="nav navbar-nav navbar-right" style="margin-right:20px;" >',
                        '<li style="width:172px!important;" class="hidden-sm hidden-xs">',
                        '<a href="" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-user" ng-cloak></i>&nbsp;{{objectName.data.name}}<b class="caret"></b></a>',
                        '<ul class="dropdown-menu" style="padding-left: 3px;">',
                        '<li><a href="../dhis-web-commons-about/showUpdateUserProfileForm.action"><i class="fa fa-pencil"></i>&nbsp;Update Info</a></li>',
                        '<li><a href="../dhis-web-commons-about/userSettings.action"><i class="fa fa-pencil"></i>&nbsp;User Settings</a></li>',
                        '<li><a href="../dhis-web-commons-about/help.action"><i class="fa fa-question-circle " style="color:black;"></i>&nbsp;Help Center</a></li>',
                        '<li><a href="../dhis-web-commons-about/about.action" class="menuLink"><i class="fa fa-info-circle" style="color:black;"></i>&nbsp;About ARDS</a></li>',
                        '<li><a href=""|{}/dhis-web-commons-about/showUpdateUserAccountForm.action"><i class="fa fa-lock"></i>&nbsp;Change Password</a></li>',
                        '<li class="divider"></li>',
                        '<li><a href="{{fileUrl}}/dhis-web-commons-security/logout.action"><i class="fa fa-power-off"></i>&nbsp;Logout</a></li>',
                        '</ul>',
                        '</li>',
                        '</ul>',
                        '</div>',
                        '</nav>',
                        '</div>'

                    ].join(''),
                    controller: function ($scope,$http) {
                        dhis2.menu.ui.initMenu();
                        $scope.fileUrl=dhis2.settings.getBaseUrl();
                        var url =dhis2.settings.getBaseUrl()+"/dhis-web-commons/menu/getModules.action";
                        $http.get(dhis2.settings.getBaseUrl()+'/api/me.json').then(function(response){
                            $scope.objectName=response;
                            console.log($scope.objectName);
                        },function(response){
                            $scope.test="Some thing Went wrong";
                        });
                        $scope.menus = {};
                        $http.get(url).success(function(data){
                            angular.forEach(data.modules,function(menu){
                                $scope.menus[menu.name] = true;

                            })
                        })

                    }
                }

            }]);

        angular.module('d2HeaderBar', ['d2Menu'])
            .directive('d2HeaderBar', function () {
                return {
                    restrict: 'EA',
                    replace: true,
                    scope: {},
                    controller: d2HeaderBarController,
                    template: [
                        '<div class="header-bar row normal" id="header" style="background-color:#457B49;">',
                        '<div class="col-md-2" style="font-weight: bolder;">',
                        '<div style="font-weight: bolder; color:#fff;" class="hidden-sm hidden-xs">',
                        '<img src="{{pathUrl}}/dhis-web-commons/css/portalImages/nembo.png" class="img-rounded pull-left" style="height: 65px;width:70px">',
                        '</div>',
                        '</div>',
                        '<div class="col-md-8 text-center" >',
                        '<span style="font-size:30px;text-align: center;color:#fff;font-weight:bolder;letter-spacing:1px">UNITED REPUBLIC OF TANZANIA</span>',
                        '<br><span style="font-size:14px;text-align: center;color:#fff;font-weight:bolder;letter-spacing: 3px;">ARDS WEB PORTAL</span>',
                        '</div>',
                        '<div class="col-md-2 hidden-sm hidden-xs">',
                        '<img src="{{pathUrl}}/dhis-web-commons/css/portalImages/tz_flag.gif" class="img-rounded pull-right" style="height: 65px; width: 70px">',
                        '</div>',
                        '<div id="headerMessage" class="bold"></div>',
                        '<div ards-menu></div>',
                        '</div>'



                        //'<div class="header-bar" id="header">',
                        //    '<a ng-href="{{headerBar.link}}" title="{{headerBar.title}}" class="title-link">',
                        //        '<img class="header-logo" ng-src="{{headerBar.logo}}" id="headerBanner">',
                        //        '<span class="header-text" ng-bind="headerBar.title" id="headerText"></span>',
                        //    '</a>',
                        //    '<div id="headerMessage" class="bold"></div>',
                        //    //'<div d2-menu></div>',
                        //'</div>'
                    ].join('')
                };

                /**
                 * @description
                 * Priority of the color scheme that is being loaded is as follows
                 * 1. /api/userSettings/keyStyle
                 * 2. /api/systemSettings {keyStyle property on the systemSettings object}
                 * 3. The default style as defined in this function using the `defaultStyle` variable
                 */
                function d2HeaderBarController($scope, $http) {
                    var ctrl = $scope;
                    var baseUrl = dhis2.settings.getBaseUrl();
                    $scope.pathUrl=dhis2.settings.getBaseUrl();
                    var defaultStyle = 'light_blue';
                    var defaultStylesheetUrl = 'light_blue/light_blue.css';
                    var stylesLocation = 'dhis-web-commons/css';

                    ctrl.headerBar = {
                        title: '',
                        logo: '',
                        link: ''
                    };

                    initialise();

                    function initialise() {
                        getSystemSettings()
                            .then(getHeaderBarData)
                            .catch(loadDataFromLocalStorageIfAvailable)
                            .then(saveToLocalStorage)
                            .then(function (headerData) {
                                setHeaderData(headerData.userStyleUrl, headerData.logo, headerData.title, headerData.link);
                            });
                    }

                    function getHeaderBarData(systemSettings) {
                        return requestUserStyle()
                            .catch(function () {
                                console && console.info && console.info('Unable to load usersettings, falling back to systemSettings');
                                localStorage.setItem('dhis2.menu.ui.headerBar.userStyle', systemSettings.keyStyle);
                                return systemSettings.keyStyle;
                            })
                            .then(function (userStyleUrl) {
                                return {
                                    userStyleUrl: userStyleUrl || systemSettings.keyStyle,
                                    logo: systemSettings.keyCustomTopMenuLogo,
                                    title: systemSettings.applicationTitle,
                                    link: systemSettings.startModule
                                };
                            });
                    }

                    function loadDataFromLocalStorageIfAvailable() {
                        var logo, title, link, userStyle;

                        //Load values from localStorage if they are available
                        if (islocalStorageSupported()) {
                            logo = localStorage.getItem('dhis2.menu.ui.headerBar.logo');
                            title = localStorage.getItem('dhis2.menu.ui.headerBar.title');
                            link = localStorage.getItem('dhis2.menu.ui.headerBar.link');
                            userStyle = localStorage.getItem('dhis2.menu.ui.headerBar.userStyle');
                        }

                        return {
                            userStyleUrl: userStyle,
                            logo: logo,
                            title: title,
                            link: link
                        };
                    }

                    function setHeaderData(userStyleUrl, logo, title, link) {
                        var userStyleName = getStyleName(userStyleUrl);

                        addUserStyleStylesheet(getStylesheetUrl(userStyleUrl));
                        addUserStyleStylesheet("../api/files/style/external");
                        setHeaderLogo(userStyleName, logo);
                        setHeaderTitle(title);
                        setHeaderLink(link);
                    }

                    function getSystemSettings() {
                        var settingsUrl = [baseUrl, 'api', 'systemSettings'].join('/');

                        return $http.get(settingsUrl, {responseType: 'json', cache: true})
                            .then(function (response) {
                                return response.data || {};
                            });
                    }

                    function setHeaderLogo(userStyleName, customTopMenuLogo) {
                        if (customTopMenuLogo === true) {
                            ctrl.headerBar.logo = [baseUrl, '/external-static/logo_banner.png'].join('');
                        } else {
                            if (isValidUserStyle(userStyleName)) {
                                ctrl.headerBar.logo = getStyleLogoUrl(userStyleName);
                            } else {
                                ctrl.headerBar.logo = getStyleLogoUrl(defaultStyle);
                            }
                        }
                    }

                    function setHeaderTitle(applicationTitle) {
                        ctrl.headerBar.title = applicationTitle || 'District Health Information Software 2';
                    }

                    function setHeaderLink(startModule) {
                        ctrl.headerBar.link = [baseUrl, startModule || 'dhis-web-dashboard-integration', 'index.action'].join('/');
                    }

                    function requestUserStyle() {
                        var currentUserStyleUrl = [baseUrl, 'api', 'userSettings', 'keyStyle'].join('/');

                        return $http.get(currentUserStyleUrl, {responseType: 'text', cache: true, headers: {'Accept': 'text/plain'}})
                            .then(function (response) {
                                return response.data.trim();
                            });
                    }

                    function getStyleLogoUrl(styleName) {
                        return [baseUrl, stylesLocation, styleName, 'logo_banner.png'].join('/');
                    }

                    function getStylesheetUrl(stylesheet) {
                        return [baseUrl, stylesLocation, stylesheet || defaultStylesheetUrl].join('/');
                    }

                    function getStyleName(userStyle) {
                        if (typeof userStyle === 'string' && userStyle.split('/')[0] && userStyle.split('/').length > 0) {
                            return userStyle.split('/')[0];
                        }
                        return defaultStyle;
                    }

                    function isValidUserStyle(userStyle) {
                        return typeof userStyle === 'string' && /^[A-z0-9_\-]+$/.test(userStyle);
                    }

                    function addUserStyleStylesheet(stylesheetUrl) {
                        angular.element(document.querySelector('head'))
                            .append('<link href="' + stylesheetUrl + '" type="text/css" rel="stylesheet" media="screen,print" />');
                    }

                    function islocalStorageSupported() {
                        try {
                            localStorage.setItem('dhis2.menu.localstorage.test', 'dhis2.menu.localstorage.test');
                            localStorage.removeItem('dhis2.menu.localstorage.test');
                            return true;
                        } catch(e) {
                            return false;
                        }
                    }

                    function saveToLocalStorage(headerData) {
                        if (islocalStorageSupported()) {
                            localStorage.setItem('dhis2.menu.ui.headerBar.userStyle', headerData.userStyleUrl);
                            localStorage.setItem('dhis2.menu.ui.headerBar.logo', headerData.logo);
                            localStorage.setItem('dhis2.menu.ui.headerBar.title', headerData.title);
                            localStorage.setItem('dhis2.menu.ui.headerBar.link', headerData.link);
                        }

                        return headerData;
                    }
                }
            });

    } else {
        //If there is no angular we just run our normal init function to find tags ourselves
        dhis2.menu.ui.initMenu();
    }
})();
