document.addEventListener("cart:added", () => handleFreeShippingBar())
document.addEventListener("change", e => handleVariant(e))
document.addEventListener("submit", e => addToCart(e))
document.addEventListener("DOMContentLoaded", () => createCarousel())
document.addEventListener("click", e => {
  if(e.target.id === 'img-container') {
    handleImg(e)
  }
})
document.addEventListener("prevNextBtn:clicked", () => handleImg())

//Change value of free shipping bar. Show if you have free shipping or how much you need for get it
const handleFreeShippingBar = async () => {
  try{
    let response = await fetch(window.location.pathname + "?section_id=free-shipping-bar")
    let newFreeShippingBar = await response.text()
  
    if(!response.ok) throw {status: response.status, statusText: response.statusText}
    
    //remove the "<div id=... class=...></div>" from newFreeShippingBar (my section updated)
    let i = newFreeShippingBar.indexOf(">")  //find the index where first tag of first div close (shopify-section-free-shipping-bar).
    newFreeShippingBar = newFreeShippingBar.slice(i+1, -6)  //cut from i+1 (where the next tag open) to final of string -6 ("</div>").

    let freeShippingBar = document.getElementById("shopify-section-free-shipping-bar")
    freeShippingBar.innerHTML = newFreeShippingBar

  }catch(error){
    let freeShippingText = document.getElementById("free-shipping-text")
    freeShippingText.innerText = error.statusText || "Oops... An error occurred"
  }
}

//get variantId from hidden select tag to add to cart
const addToCart = (e) => {
  if(e.target.name !== 'quick-product-form') return
  e.preventDefault()

  let variantId = e.target.input_variants.value

  postData(variantId)
}

//add variant to cart
const postData = async(variantId) => {
  let formData = {
    'items': [{
      'id': variantId,
      'quantity': 1
    }]
  }

  try{
    let response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    let cart = await response.json()

    if(!response.ok) throw { status: response.status, statusText: response.statusText }

    let notification = document.querySelector('cart-notification')
    notification.renderContentsFromQuickAdd(cart.items[0])

    const eventCartAdded = new CustomEvent("cart:added", {})
    document.dispatchEvent(eventCartAdded)

  }catch(error){
    console.error(error)
  }
}

//Find and change the current variant by option values
const handleVariant = (e) => {
  if(e.target.name !== 'input_options') return

  let form = e.target.parentElement.parentElement.parentElement //e is the select tag. It have 2 div and the form tag as parents
  let allVariants = [...form.input_variants.children] //get all options of select tag

  let options = []
  if(form.input_options.tagName === 'SELECT'){
    options = [form.input_options]
  }else{
    options = [...form.input_options]
  }
  options = options.map(op => op.value)

  allVariants.forEach(variant => {
    if(variant.dataset.op1 === options[0]) {
      if(variant.dataset.op2 === options[1] || !variant.dataset.op2) {
        if(variant.dataset.op3 === options[2] || !variant.dataset.op3) {
          variant.selected = true
        }
      }
    }else{
      variant.selected = false
    }
  })

  if(e.target.id === 'color_select'){ //to change the images in card_product when color option is changed
    handleCarousel(e.target.value.toLowerCase(), form.dataset.product)
  }
}

//change the images in card_product
const handleCarousel = (colorFromOption, productId) => {
  let carousel = document.getElementById(`${productId}-carousel`)

  //obtain generic data from images
  let sizes = carousel.querySelector('img').sizes
  let loading = carousel.querySelector('img').loading

  //obtain data from data-imgs (data-imgs="src1-alt1,src2-alt2,src3-alt3,...")
  let imgs = carousel.dataset.imgs.split(",")
  let colors = imgs.map(img => img.split("#").pop())
  let srcs = imgs.map(img => img.split("-")[0])
  let alts = imgs.map(img => img.split("-").pop())
  
  //create new main-carousel and add alls new cell-carousel with the images
  let mainCarouselTemplate = `
    <div id="${productId}-carousel" class="card__media main-carousel" data-imgs="${carousel.dataset.imgs}">
      ${
        colors.map((color, i) => {
          if(color === colorFromOption){
            return `
              <div class="media media--transparent media--hover-effect cell-carousel">
                <img
                  src=${srcs[i]}
                  sizes=${sizes}
                  alt=${alts[i]}
                  class="motion-reduce"
                  loading="${loading}"
                >
              </div>
            `
          }
        })
      } 
    </div>
  `

  //insert new main-carousel in the DOM and get it
  document.getElementById(`${productId}-card_inner`).innerHTML = mainCarouselTemplate
  carousel = document.getElementById(`${productId}-carousel`)

  //create new Flickity
  new Flickity( carousel, {
    cellAlign: 'left',
    contain: true,
    draggable: false
  })
}

//create all carousels
const createCarousel = () => {
  let allCarousels = [...document.querySelectorAll('.main-carousel')]
  
  allCarousels.forEach(carousel => {
    if(carousel.parentElement.id.includes("-card")){
      new Flickity( carousel, {
        cellAlign: 'left',
        contain: true,
        draggable: false
      })
    }
  })
}

const handleImg = (e = null) => {
  let alt
  if(e === null) {
    let mainCarousel = document.querySelector('.main-carousel')
    alt = mainCarousel.querySelector('.is-selected').children[0].alt
  }else{
    alt = e.target.alt
  }

  let form = document.querySelector(".product-form__input")
  let inputs = [...form.children]
  inputs = inputs.filter(input => input.type === "radio")
  
  inputs.forEach(input => {
    if(input.value.toLowerCase() === alt.split("#").pop()){
      input.checked = true
      form.parentElement.dispatchEvent(new CustomEvent('img:clicked', {}))
    }else{
      input.checked = false
    }
  }) 
}