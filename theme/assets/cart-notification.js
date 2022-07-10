class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);
    
    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  open() {
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener('transitionend', () => {
      this.notification.focus();
      trapFocus(this.notification);
    }, { once: true });

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.notification.classList.remove('active');

    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
      this.cartItemKey = parsedState.key;
      this.getSectionsToRender().forEach((section => {
        document.getElementById(section.id).innerHTML =
          this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }));

      if (this.header) this.header.reveal();
      this.open();
  }

  renderContentsFromQuickAdd(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section => this.getSectionRendered(section.id) ));

    if (this.header) this.header.reveal();
    this.open();
  }

  async getSectionRendered(sectionId){
    try{
      let response = await fetch(window.location.pathname + `?section_id=${sectionId}`)
      let newSection = await response.text()
    
      if(!response.ok) throw {status: response.status, statusText: response.statusText}
      
      //remove the "<div id=... class=...></div>" from newSection (my section updated)
      let i = newSection.indexOf(">")  //find the index where first tag of first div close (sectionId).
      newSection = newSection.slice(i+1, -6)  //cut from i+1 (where the next tag open) to final of string -6 ("</div>").
  
      let section = document.getElementById(sectionId)
      section.innerHTML = newSection
  
    }catch(error){
      console.error(error)
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
