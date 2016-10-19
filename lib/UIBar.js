/**
 * Show a notification bar that can display a variety of text labels, buttons and links.
 *
 * @param chromeWindow
 *        The chrome window that the notification is displayed in.
 * @param {Object} options Options object.
 * @param {String} options.message
 *        The message, or question, to display on the notification.
 * @param {String} options.actionName
 *        Value used to identify the notification
 * @param {String} [options.iconUrl]
 *        Url of the icon to appear in the notification
 * @param {String} options.priority
 *        Priority level of the notification (i.e.g 'PRIORITY_INFO_HIGH')
 * @param {Array} [options.buttons=[]]
 *        Array of button descriptions to appear on the notification
 * @param {Function} [options.eventCallback=null]
 *        A function to notify you of events withing the notification box
 * @param {Array} [options.items=[]]
 *        An array of additional elements you'd like to add to the notification bar
 */
exports.UIBar = class {
  constructor(chromeWindow, options) {
    this.chromeWindow = chromeWindow;
    this.options = options;

    let frag = this.chromeWindow.document.createDocumentFragment();
    frag.appendChild(this.createLabel({
      text: this.options.message,
    }));

    this.notificationBox = this.chromeWindow.document.querySelector('#high-priority-global-notificationbox');
    this.notice = this.notificationBox.appendNotification(
      frag,
      this.options.actionName,
      this.options.iconUrl,
      this.notificationBox[this.options.priority],
      this.options.buttons || [],
      this.options.eventCallback
    );

    this.options.items.forEach(itemDetails => {
      let elem;

      switch (itemDetails.type) {
        case 'label':
          elem = this.createLabel(itemDetails);
          break;
        case 'link':
          elem = this.createLink(itemDetails);
          break;
        case 'spacer':
          elem = this.createSpacer(itemDetails);
          break;
        case 'button':
          elem = this.createButton(itemDetails);
          break;
        case 'fragment':
          elem = itemDetails.elem;
          break;
        default:
          return;
      }

      frag.appendChild(elem);
    });

    // Append the fragment and apply the styling
    this.notice.appendChild(frag);
    this.notice.classList.add('heartbeat');
  }

  createLabel(options) {
    let label = this.chromeWindow.document.createElement('label');
    label.setAttribute('value', options.text);
    return label;
  }

  createLink(options) {
    let link = this.chromeWindow.document.createElement('label');
    link.className = 'text-link';
    link.setAttribute('value', options.text);

    if (options.url) {
      link.href = options.url.toString();
    }

    if (options.callback) {
      link.addEventListener('click', e => {
        options.callback(e);
      });
    }

    return link;
  }

  createButton(options) {
    let button = this.chromeWindow.document.createElement('button');
    button.setAttribute('label', options.text);

    if (options.iconURL) {
      button.setAttribute('image', options.iconURL);
    }

    if (options.callback) {
      button.addEventListener('command', e => {
        options.callback(e);
      });
    }

    return button;
  }

  createSpacer(options) {
    let spacer = this.chromeWindow.document.createElement('spacer');
    spacer.flex = options.flexSpace;
    return spacer;
  }
};
