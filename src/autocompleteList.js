(function() {
  'use strict';

  angular.module('autocompleteList', ['ngMaterial']).directive('autocompleteList', autocompleteList);

  /**
   * @name Autocomplete List Directive
   *
   * @description This element is made up of an md-autocomplete that will show prompts based on the unselected items, and an md-list that will display all selected items.
   * ### Customizing list contents
   * The contents of the list is by default based on the text of each items generated by the `itemText` expression. The exact contents is:
```html
<p>{{ aclCtrl.itemText({item: item}) }}</p>

<md-button
  type="button"
  class="md-exclude multi-select-secondary-button"
  ng-click="aclCtrl.deselectItem(item)"
  aria-label="remove">
  <md-icon>
    <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      <path d="M0 0h24v24H0z" fill="none"/>
    </svg>
  </md-icon>
</md-button>
```
   * The contents can be customized by providing contents to the directive which will then be rendered inside each list item. When writing custom contents you have access to the following properties and functions:
   *
   * | Name | Type | Description |
   * | ---- | ---- | ----------- |
   * | item | <code>Object</code> | The item object to render |
   * | aclCtrl.itemText | <code>Function</code> | The function that wraps the expression provided for `itemText`. To call it you need to provide an object with a single property; `item`, which is the item to build the text for. Eg. `<p>{{ aclCtrl.itemText({item: item}) }}</p>` |
   * | aclCtrl.deselectItem | <code>Function</code> | When called, will remove an item from the model. The first argument is the item to remove. Eg. <md-button ng-click="aclCtrl.deselectItem(item)"></md-button> |
   *
   * ### Directive attributes
   * @param {Array.<Object>} ngModel - Required. Array of selected objects. These are tracked via reference.
   * @param {Array.<Object>} items - Entire list of items to select from.
   * @param {Expression} itemText - Expression to convert an item object into a single string to be displayed in the autocomplete and the list. The text generated here will also be searched when the user types in the autocomplete box. The item is accessed via the `item` property.
   * @example
<autocomplete-list
  ng-model="ctrl.selectedPeople"
  items="ctrl.allPeople"
  item-text="item.firstName + ' ' + item.lastName">
</autocomplete-list>
   */
  function autocompleteList() {
    return {
      restrict: 'EA',
      templateUrl: templateUrlFunc,
      require: {
        ngModel: 'ngModel',
        autocompleteList: 'autocompleteList'
      },
      controllerAs: 'aclCtrl',
      bindToController: true,
      scope: {
        // Full list of all items
        items: '=',
        // An expression that converts an item into a text string
        itemText: '&'
      },
      compile: compileFunc,
      controller: ctrlFunc
    };
  }


  function templateUrlFunc(element, attrs) {
    // Clone the user's element, and save it
    // After stripping all empty text nodes from it.
    var clone = element.clone();

    attrs.$mdUserTemplate = clone;
    return 'autocompleteList.html';
  }


  function compileFunc(element, attrs) {
    // The place to insert the contents
    var listElement = element[0].querySelector('md-list-item');
    // The user's original content filtered to only return elements
    var userListContent = attrs.$mdUserTemplate[0].querySelectorAll('*');

    // Append the user's content to the template
    if (userListContent.length > 0) {
      for (var i = 0; i < userListContent.length; ++i) {
        listElement.appendChild(userListContent[i]);
      }
    }
    // If no list contents has been specified, fill it with the default
    else {
      angular.element(listElement).attr('ng-include', "'autocompleteListContents.html'");
    }

    return linkFunc;
  }


  function linkFunc(scope, element, attrs, ctrls, transclude) {
    // Attach the model controller to this directive's controller
    ctrls.autocompleteList.modelCtrl = ctrls.ngModel;
  }


  function ctrlFunc() {
    // jshint validthis: true

    //-- private variables
    var ctrl = this;

    //-- public variables
    ctrl.searchText = "";
    ctrl.modelCtrl = null;

    //-- public methods
    ctrl.selectedItemChange = selectedItemChange;
    ctrl.matchingItems = matchingItems;
    ctrl.deselectItem = deselectItem;
    ctrl.selectedItems = selectedItems;
    ctrl.itemText = ctrl.itemText || function(item) { return item; };


    function selectedItems() {
      return ctrl.modelCtrl.$modelValue;
    }


    // Called when an item is selected via the autocomplete
    function selectedItemChange(item) {
      // If the item has not been cleared
      if (item) {
        // Add the item to the model
        var value = ctrl.selectedItems().concat(item);
        ctrl.modelCtrl.$setViewValue(value);

        // Clear the selectedItem
        ctrl.searchText = '';
      }
    }


    // Iterates through all the items and checks if their text representation
    // contains the search string.
    // Automatically filters out selected items
    function matchingItems(string) {
      // Lowercase String
      string = string.toLowerCase();

      var items = [];
      ctrl.items.forEach(function(item) {
        // Skip selectedItems

        if (ctrl.selectedItems().indexOf(item) !== -1) {
          return;
        }

        // Check if the search string could be contained in the item text
        if (itemMatchesString(item, string)) {
          items.push(item);
        }
      });

      return items;
    }


    function itemMatchesString(item, string) {
      if (ctrl.itemText({item: item}).toLowerCase().indexOf(string) !== -1) {
        return true;
      }
    }


    // Called to remove an item from selectedItems
    function deselectItem(item) {
      for (var i = 0; i < ctrl.selectedItems().length; ++i) {
        if (ctrl.selectedItems()[i] === item) {
          ctrl.selectedItems().splice(i, 1);
          return;
        }
      }
    }
  }
})();



/* Attributes:
*  - ngModel:
*     ngModel can either be an array of objects or a single object.
*     If it is an array, each object should be in the form:
*         {
*             text: 'Text to display on the control',
*             value: 'The default value of the item'
*         }
*     If it is an object, each key value pair becomes an option in the
*     list such that the key represents the text value and the paired
*     value is the default value of the item.
*     Eg:
*         {
*             'Text to display on the control': 'Default value of the item'
*             ....
*         }
* - options:
*     If options is present, a select control is added to each item instead
*     of a checkbox. options should be a plain object where each key becomes
*     the text content of the <option> element and the value becomes the
*     value attribute.
*/
