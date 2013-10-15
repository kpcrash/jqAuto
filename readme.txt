jqAuto
Version 0.9
10/15/2013

What it does:
The jqAuto function extends the Autocomplete widget from the jQuery UI library by adding a few functions that make it interact more like a combo or select object,
and add a bit of keyboard interaction as well. This version is stable, but there's more to be done. Includes features to set a default value or text. Tested with
jQuery 1.8 or greater and jQuery UI 1.10 or greater.


Basic Usage:
$(document).ready(function () {
            $(selector).jqauto({
                url: 'something that returns json',
                getpost: 'GET', //default is POST
                jsonRoot: 'Results',// top level JSON object
                valueFieldName: 'id', //if this were a select, the value field
                textFieldName: 'value', //if this were a select, the text field
				ajaxOptions: {cache:true} //way to override the built-in ajax options
            });
        });


Noteworthy Options:
itemClickedCallback: Expects a function that will be called after the user makes a selection - either by click or keyboard select.
buildUrl: Allows for the ajax url to be built by a function
defaultValue: Allows for a default value to be set for the autocomplete
defaultText: Allows for a default text value to be set. Once found, the value attribute will be automatically set
autoSelectSingleOption: For cases when the result is only one option, this will automatically select it on focus
termCache: Allows for basic caching of results based upon search criteria

Noteworthy Functions:
getInputElement: returns the original input element
getSelectedItem: returns the selected item object {label (what's shown), value (the value), extra (explained below), result (original returned text)}
getMatchedItems: returns an array of item objects based on user's search criteria (all items shown)
getAllItems: returns all possible items from query as an array of item objects

Notes:
The defaultValue and defaultText options require a full lookup prior to them being set. This is for self-validation. It can be a little expensive depending on how the backend
is handling the search. In testing, it was worth the cost.

All Options:
url: The url of the service returning data
buildUrl: a function that returns a url to populate the url option
dataParams: standard dataParams object for $.ajax
getpost: GET or POST, default is POST
valueFieldName: if this were a select, the value field
textFieldName: if this were a select, the text field
addlFieldName: for those times when you have one field for value, one field for the label(text) shown, but after selection need to show something else. 

For example, you have a list of colors:
Value - Label - Extra
1	Red (something describing Red) Red
When the user sees the list, they see the full description, but on select, they see the shortened description. Great for keeping the width of a dropdown under control

defaultValue: the default value to set
defaultText: the default text to be set. If defaultValue and defaultText are set and they do not match, defaultText will win
inputwidth: the width of the autocomplete
inputheight: the height of the autocomplete
termcache: boolean as to whether or not term-based caching is enabled. Default is false
jsonRoot: The root object in the returned json
autoSelectSingleOption: For cases when the result is only one option, this will automatically select it on focus
itemClickedCallback: function for when the user makes a selection
dropDownWidth: the width of the dropdown shown, default is "auto"
showDropDownArrow: default is false. If true, will style the autocomplete with a select style dropdown arrow
ajaxOptions:
 - async: default is false in order to make defaultValue or defaultText work correctly
 - cache: default is false
 - dataType: default is 'json'
 - contentType: default is 'application/json; charset=utf-8'


Questions/Comments - kpcrash@gmail.com
