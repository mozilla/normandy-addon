class Notify {
  constructor() {
    self.port.on('data', recs => {
      this.removeOldBoxes();
      this.createNewBoxes(recs);
    });
  }

  //removes old recommendations, that may be for a different domain
  removeOldBoxes() {
    var recDiv = document.getElementById('recs');
    while(recDiv.firstChild) {
      recDiv.removeChild(recDiv.firstChild);
    }
  }


  createNewBoxes(recs) {
    for(var i = 0; i < recs.length; i++) {
      var box = this.createNewBox();
      this.fillInValues(box, recs[i]);
    }
  }


  //replace default inner-html values
  fillInValues(div, data) {
    div.getElementsByClassName('name')[0].innerHTML = data.name;
    div.getElementsByClassName('description')[0].innerHTML = data.description;
    div.getElementsByClassName('image')[0].setAttribute('src', data.imageURL);
    var info = div.getElementsByClassName('info')[0];
    info.setAttribute('href', data.infoURL);
    info.addEventListener('click', event => {
      event.preventDefault();
      window.open(data.infoURL);
    });
    var button = div.getElementsByTagName('button')[0];
    button.addEventListener('click', () => {
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


  markAsInstalled(button) {
    button.setAttribute('disabled', true);
  }


  requestInstall(button, url) {
    self.port.emit('install', url);
    this.markAsInstalled(button);
  }
}

var notify = new Notify();
