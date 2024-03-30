//sidebar
const menuItems = document.querySelectorAll('.menu-item');
const messagesNotification = document.querySelector('#messages-notifications');
const messages = document.querySelector('.messages');
// const message = messages.querySelectorAll('.message');
const messageSearch = document.querySelector('#message-search');

//remove active class from all menu items
const changeActiveItem = () => {
    menuItems.forEach(item => {
        item.classList.remove('active');
    })
}
 

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        changeActiveItem();
        item.classList.add('active');
        
    })
})


const searchMessage = () => {
    const val = messageSearch.value.toLowerCase();
    message.forEach(chat => {
        let name=chat.querySelector('h5').textContent.toLowerCase();
        if(name.indexOf(val) != -1){
            chat.style.display = 'flex';
        } else{
            chat.style.display = 'none';
        }
    })
}

const closeBookmark = document.getElementById("close-bookmark");
closeBookmark.addEventListener("click", () => {
    changeActiveItem();
    let homeMenu = document.getElementById("home-menu");
    homeMenu.classList.add('active');
})