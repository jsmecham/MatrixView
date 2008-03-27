//
// MatrixView 1.0.3
//
// For more information on this library, please see http://www.matrixview.org/.
//
// Copyright (c) 2007-2008 Justin Mecham <justin@aspect.net>
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

var MatrixView = Class.create()

MatrixView.prototype = {

  // The Attached Element
  element: null,

  // Handlers
  selectHandler: null,
  deselectHandler: null,
  openHandler: null,
  deleteHandler: null,

  // Selected Items
  selectedItems: null,

  initialize: function(element, params)
  {

    this.selectHandler   = params['selectHandler']
    this.deselectHandler = params['deselectHandler']
    this.openHandler     = params['openHandler']
    this.deleteHandler   = params['deleteHandler']
    this.selectedItems   = new Array()
    this.element         = element

    window.matrixView    = this

    // Observe keys
    Event.observe(document, 'keydown',
      function(event)
      {

        // Meta/Control
        if (event.metaKey)
        {
          if (event.keyCode == 65) // Shift-A (Select All)
          {
            window.matrixView.selectAll()
            event.stop()
            return false
          }
          return
        }

        // Shift
        else if (event.shiftKey)
        {
          if (event.keyCode == Event.KEY_LEFT || event.keyCode == 63234) // Left Arrow
            window.matrixView.expandSelectionLeft(event)
          if (event.keyCode == Event.KEY_UP || event.keyCode == 63232) // Up Arrow
            window.matrixView.expandSelectionUp(event)
          if (event.keyCode == Event.KEY_RIGHT || event.keyCode == 63235) // Right Arrow
            window.matrixView.expandSelectionRight(event)
          if (event.keyCode == Event.KEY_DOWN || event.keyCode == 63233) // Down Arrow
            window.matrixView.expandSelectionDown(event)
          if (event.keyCode == 32) // Space
            event.stop()
          if (event.keyCode == Event.KEY_TAB) // Tab
          {
            if (window.matrixView.selectedItems.size() > 0)
              window.matrixView.moveLeft(event)
          }
          return
        }

        if (event.keyCode == Event.KEY_RETURN) // Enter (Open Item)
        {
          if (window.matrixView.selectedItems.size() == 1)
            window.matrixView.open(window.matrixView.selectedItems.first())
        }
        if (event.keyCode == Event.KEY_BACKSPACE || event.keyCode == Event.KEY_DELETE || event.keyCode == 63272) // Delete/Backspace
        {
          window.matrixView.destroy(window.matrixView.selectedItems)
          event.stop()
        }
        if (event.keyCode == Event.KEY_LEFT || event.keyCode == 63234) // Left Arrow
          window.matrixView.moveLeft(event)
        if (event.keyCode == Event.KEY_UP || event.keyCode == 63232) // Up Arrow
          window.matrixView.moveUp(event)
        if (event.keyCode == Event.KEY_RIGHT || event.keyCode == 63235) // Right Arrow
          window.matrixView.moveRight(event)
        if (event.keyCode == Event.KEY_DOWN || event.keyCode == 63233) // Down Arrow
          window.matrixView.moveDown(event)
        if (event.keyCode == 32) // Space
          event.stop()
        if (event.keyCode == Event.KEY_TAB) // Tab
        {
          if (window.matrixView.selectedItems.size() > 0)
            window.matrixView.moveRight(event)
        }
      }
    )

    // Double Click
    Event.observe(element, 'dblclick',
      function(event) {
        element = Event.element(event)
        if (element.tagName != 'LI') element = element.up('li')
        if (element)
        {
          window.matrixView.deselectAll()
          window.matrixView.open(element)
        }
        event.preventDefault()
      }
    )

    // Click / Mouse Down
    Event.observe(element, 'mousedown',
      function(event) {
        element = Event.element(event)

        // For Safari, since it passes thru clicks on the scrollbar, exclude 15 pixels from the click area
        if (Prototype.Browser.WebKit)
        {
//          dimensions = window.matrixView.element.getDimensions
          if (window.matrixView.element.scrollHeight > window.matrixView.element.getHeight())
          {
            if (Event.pointerX(event) > (window.matrixView.element.getWidth() + Position.cumulativeOffset(window.matrixView.element)[0] - 15))
            {
              event.stop()
              return
            }
          }
        }

        if (element.tagName != 'LI') element = element.up('li')
        if (element)
          window.matrixView.select(element, event)
        else
          window.matrixView.deselectAll()

        event.preventDefault()
      }
    )

  },

  deselectAll: function() {
    this.element.getElementsBySelector('li.selected').invoke('removeClassName', 'selected')
    this.selectedItems.clear()
    // If a custom deselect handler has been defined, call it
    if (this.deselectHandler != null)
      this.deselectHandler()
  },

  select: function(element, event)
  {

    // Multiple Selection (Shift-Select)
    if (event && event.shiftKey)
    {
      // Find first selected item
      firstSelectedElement      = this.element.down('li.selected')
      firstSelectedElementIndex = this.items().indexOf(firstSelectedElement)
      selectedElementIndex      = this.items().indexOf(element)

      // If the first selected element is the element that was clicked on
      // then there's nothing for us to do.
      if (firstSelectedElement == element)
        return

      // If no elements are selected already, just select the element that
      // was clicked on.
      if (firstSelectedElementIndex == -1) {
        window.matrixView.select(element)
        return
      }

      siblings = null
      if (firstSelectedElementIndex < selectedElementIndex)
        siblings = firstSelectedElement.nextSiblings()
      else
        siblings = firstSelectedElement.previousSiblings()
      done = false
      siblings.each(
        function(el) {
          if (done == false) {
            el.addClassName('selected')
            window.matrixView.selectedItems.push(el)
          }
          if (element == el) done = true
        }
      )
    }

    // Multiple Selection (Meta-Select)
    else if (event && event.metaKey)
    {
      // If the element is already selected, deselect it
      if (element.hasClassName('selected'))
      {
        this.selectedItems[this.selectedItems.indexOf(element)] = null
        element.removeClassName('selected')
      }

      // Otherwise, select it
      else
      {
        this.selectedItems.push(element)
        element.addClassName('selected')
      }
    }

    // Single Selection (Single Click)
    else
    {
      $$('#' + this.element.id + ' li.selected').invoke('removeClassName', 'selected')
      this.selectedItems = new Array(element)
      element.addClassName('selected')
    }

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  open: function(element)
  {
    this.deselectAll()
    element.addClassName('selected')
    // If a custom open handler has been defined, call it
    if (this.openHandler != null)
      this.openHandler(element)
  },

  destroy: function(elements)
  {
    // If a custom open handler has been defined, call it
    if (this.deleteHandler != null)
      this.deleteHandler(elements)
  },

  selectAll: function()
  {
    this.deselectAll()
    $$('#' + this.element.id + ' li').each(
      function(el) {
        el.addClassName('selected')
        window.matrixView.selectedItems.push(el)
      }
    )

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(window.matrixView.selectedItems)
  },

  selectFirst: function()
  {

    element = $$('#' + this.element.id + ' li').first()

    this.deselectAll()
    this.select(element)

    this.scrollIntoView(element, 'down')

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  selectLast: function()
  {
    element = $$('#' + this.element.id + ' li').last()

    this.deselectAll()
    this.select(element)

    this.scrollIntoView(element, 'down')

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  moveLeft: function(event)
  {
    event.stop()
    element = $$('#' + this.element.id + ' li.selected').first()
    if (!element)
      return this.selectFirst()
    if (previousElement = element.previous())
    {
      this.select(previousElement)
      this.scrollIntoView(previousElement, 'up')
    }
    else
      this.selectFirst()
  },

  moveRight: function(event)
  {
    event.stop()
    element = $$('#' + this.element.id + ' li.selected').last()
    if (!element)
      return this.selectFirst()    
    if (nextElement = element.next())
    {
      this.select(nextElement)
      this.scrollIntoView(nextElement, 'down')
    }
    else
      this.selectLast()
  },

  moveUp: function(event)
  {
    event.stop()

    element = $$('#' + this.element.id + ' li.selected').first()
    if (!element) return this.selectFirst()

    offset = Position.cumulativeOffset(element)
    y = Math.floor(offset[1] - element.getHeight())

    previousSiblings = element.previousSiblings()
    if (previousSiblings.size() == 0) return this.selectFirst()

    previousSiblings.each(
      function(el) {
        if (Position.within(el, offset[0], y))
        {
          window.matrixView.select(el)
          window.matrixView.scrollIntoView(el, 'up')
        }
      }
    )

  },

  moveDown: function(event)
  {
    event.stop()

    element = this.element.getElementsBySelector('li.selected').last()
    if (!element) return this.selectFirst()

    offset = Position.cumulativeOffset(element)
    y = Math.floor(offset[1] + element.getHeight() + (element.getHeight() / 2)) + parseInt($(element).getStyle('margin-bottom'))

    nextSiblings = element.nextSiblings()
    if (nextSiblings.size() == 0) return this.selectLast()

    selected = false

    nextSiblings.each(
      function(el) {
        if (Position.within(el, offset[0], y))
        {
          window.matrixView.select(el)
          window.matrixView.scrollIntoView(el, 'down')
          selected = true
        }
      }
    )

    if (!selected) this.selectLast()

  },

  expandSelectionLeft: function(event)
  {
    element = this.element.down('li.selected')
    otherElement = element.previous()
    otherElement.addClassName('selected')
    this.selectedItems.push(otherElement)

    window.matrixView.scrollIntoView(element, 'up')

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  expandSelectionRight: function(event)
  {
    element = this.element.getElementsBySelector('li.selected').last()
    otherElement = element.next()
    otherElement.addClassName('selected')
    this.selectedItems.push(otherElement)

    window.matrixView.scrollIntoView(element, 'down')

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  expandSelectionUp: function(event)
  {
    event.stop()
    element        = this.element.down('li.selected')
    itemWidth      = element.getWidth()
    itemOffset     = Position.cumulativeOffset(element)
    done = false
    element.previousSiblings().each(
      function(el)
      {
        if (done == false)
        {
          el.addClassName('selected')
          window.matrixView.selectedItems.push(el)
        }
        if (Position.within(el, itemOffset[0], itemOffset[1] - element.getHeight()))
        {
          done = true
          window.matrixView.scrollIntoView(el, 'up')
        }
      }
    )

    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  expandSelectionDown: function(event)
  {
    event.stop()
    element = this.element.getElementsBySelector('li.selected').last()

    offset = Position.cumulativeOffset(element)
    y = Math.floor(offset[1] + element.getHeight() + (element.getHeight() / 2)) + parseInt($(element).getStyle('margin-bottom'))

    done = false
    element.nextSiblings().each(
      function(el)
      {
        if (done == false)
        {
          el.addClassName('selected')
          window.matrixView.selectedItems.push(el)
        }
        if (Position.within(el, offset[0], y))
        {
          done = true
          window.matrixView.scrollIntoView(el, 'down')
        }
      }
    )
 
    // If a custom select handler has been defined, call it
    if (this.selectHandler != null)
      this.selectHandler(element)
  },

  items: function()
  {
    return this.element.getElementsBySelector('li')
  },

  scrollIntoView: function(element, direction)
  {
    scrollingView = $('matrixView')
    if (direction == 'down' || direction == 'right')
    {
      if ((Position.page(element)[1] + element.getHeight()) >= (scrollingView.getHeight() + Position.cumulativeOffset(scrollingView)[1]))
        scrollingView.scrollTop = (Position.cumulativeOffset(element)[1] - scrollingView.getHeight() + element.getHeight())
      else if (Position.page(element)[1] <= 0)
        scrollingView.scrollTop = (Position.cumulativeOffset(element)[1] - scrollingView.getHeight() + element.getHeight())
    }
    else if (direction == 'up' || direction == 'left')
    {
      if ((Position.page(element)[1] + element.getHeight()) >= (scrollingView.getHeight() + Position.cumulativeOffset(scrollingView)[1]))
        scrollingView.scrollTop = (Position.cumulativeOffset(element)[1] - parseInt(element.getStyle('margin-top'))) - 24
      else if (Position.page(element)[1] <= 0)
        scrollingView.scrollTop = (Position.cumulativeOffset(element)[1] - parseInt(element.getStyle('margin-top'))) - 24
    }
  }

}