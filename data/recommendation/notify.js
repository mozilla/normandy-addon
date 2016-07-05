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

  //replace default inner-html values
  fillInValues(div, data) {
    div.querySelector('.name').innerHTML = data.name;
    div.querySelector('.description').innerHTML = data.description;
    div.querySelector('.image').setAttribute('src', data.imageURL);
    var info = div.querySelector('.info');
    info.setAttribute('href', data.infoURL);
    info.setAttribute('target', '_blank');
    var button = div.getElementsByTagName('button')[0];
    button.addEventListener('click', (event) => {
      event.preventDefault();
      this.requestInstall(button, data.packageURL);
     });
     if(data.isInstalled) {
       this.markAsInstalled(button);
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

  markAsInstalling(button) {
    button.setAttribute('disabled', true);
    button.setAttribute('class', 'installing');
  }

  markAsInstalled(button) {
    button.setAttribute('class', 'installed');
  }

  requestInstall(button, url) {
    button.id = url;
    self.port.emit('install', url);
    this.markAsInstalling(button);
    var successMessage = 'installed' + url;
    self.port.on(successMessage, () => {
      this.markAsInstalled(button);
    });
  }
}

var notify = new Notify();
