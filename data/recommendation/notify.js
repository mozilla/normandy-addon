class Notify {
  constructor() {
    self.port.on('data', recs => {
      this.clearRecommendations();
      this.addRecommendations(recs);
    });
  }

  clearRecommendations() {
    var recDiv = document.getElementById('recs');
    while(recDiv.firstChild) {
      recDiv.removeChild(recDiv.firstChild);
    }
  }

  addRecommendations(recs) {
    for(var rec of recs) {
      var box = this.createNewBox();
      this.fillInValues(box, rec);
    }
  }

  createNewBox() {
    var templateDiv = document.getElementById('template-div');
    var dupDiv = templateDiv.cloneNode(true);
    dupDiv.removeAttribute('id');
    dupDiv.removeAttribute('hidden');
    dupDiv.className = 'addon-box';
    document.getElementById('recs').appendChild(dupDiv);
    return dupDiv;
  }

  //replace default inner-html values
  fillInValues(div, data) {
    div.querySelector('.name').innerHTML = data.name;
    div.querySelector('.description').innerHTML = data.description;
    div.querySelector('.image').setAttribute('src', data.imageURL);
    var info = div.querySelector('.info');
    info.setAttribute('href', data.infoURL);
    info.setAttribute('target', '_blank');
    var button = div.getElementsByTagName('button')[0];
    button.id = data.packageURL;
    button.addEventListener('click', () => {
      this.handleClick(button, data);
    });
    if(data.isInstalled) {
      this.buttonShowInstalled(button);
    }
  }

  buttonShowInstalling(button) {
    button.setAttribute('disabled', true);
    button.setAttribute('class', 'installing');
  }

  buttonShowInstalled(button) {
    button.setAttribute('class', 'installed');
    button.removeAttribute('disabled');
  }

  buttonShowUninstalled(button) {
    button.removeAttribute('class');
    button.removeAttribute('disabled');
  }

  requestChange(command, button, data) {
    self.port.emit(command, data);
    this.buttonShowInstalling(button);
    var successMessage = command + data.packageURL;
    self.port.on(successMessage, () => {
      if(command === 'install') {
        this.buttonShowInstalled(button);
        data.isInstalled = true;
      }
      else {
        this.buttonShowUninstalled(button);
        data.isInstalled = false;
      }
    });
  }

  handleClick(button, data) {
    var command = 'install';
    if(data.isInstalled) {
      command = 'uninstall';
    }
    this.requestChange(command, button, data);
  }
}

new Notify();
