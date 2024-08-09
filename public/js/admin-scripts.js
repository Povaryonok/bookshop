document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('book-form');
    const bookList = document.getElementById('book-list');
    const usersLink = document.getElementById('users-link');
    const booksLink = document.getElementById('books-link');
    const userList = document.getElementById('user-list');
    const userBooksModal = document.getElementById('user-books-modal');
    const closeUserBooksModal = document.querySelector('.close-user-books');
    const userBooksList = document.getElementById('user-books-list');
    const usersContainer = document.getElementById('users-container');
    const booksContainer = document.getElementById('books-container');
    const editBookModal = document.getElementById('edit-book-modal');
    const closeEditBookModal = document.querySelector('.close-edit-book');
    const editBookForm = document.getElementById('edit-book-form');
    const notificationForm = document.createElement('form');
    const notificationUserId = document.createElement('input');
    const notificationMessage = document.createElement('textarea');
    const sendNotificationButton = document.createElement('button');

    // Notification form setup
    notificationForm.id = 'notification-form';
    notificationForm.style.display = 'none';
    notificationUserId.type = 'hidden';
    notificationUserId.id = 'notification-user-id';
    notificationMessage.id = 'notification-message';
    notificationMessage.placeholder = 'Enter your notification message here...';
    sendNotificationButton.type = 'submit';
    sendNotificationButton.textContent = 'Send Notification';
    notificationForm.appendChild(notificationUserId);
    notificationForm.appendChild(notificationMessage);
    notificationForm.appendChild(sendNotificationButton);
    document.body.appendChild(notificationForm);

    const fetchBooks = () => {
        fetch('/api/books')
            .then(response => response.json())
            .then(books => {
                bookList.innerHTML = '';
                books.forEach(book => {
                    const bookItem = document.createElement('div');
                    bookItem.classList.add('book-item');
    
                    bookItem.innerHTML = `
                        <img src="${book.image}" alt="${book.title}">
                        <h3>${book.title}</h3>
                        <p><strong>Author:</strong> ${book.author}</p>
                        <p>${book.description}</p>
                        <p><strong>Price:</strong> ${book.price}</p>
                        <p><strong>Year:</strong> ${book.year}</p>
                        <p><strong>Category:</strong> ${book.category}</p>
                        <p><strong>Available:</strong> ${book.available ? 'Yes' : 'No'}</p>
                        <button class="edit-button" data-id="${book.id}">Edit</button>
                        <button class="delete-button" data-id="${book.id}">Delete</button>
                    `;
    
                    bookItem.querySelector('.edit-button').addEventListener('click', () => {
                        document.getElementById('edit-book-id').value = book.id;
                        document.getElementById('edit-title').value = book.title;
                        document.getElementById('edit-author').value = book.author;
                        document.getElementById('edit-image').value = book.image;
                        document.getElementById('edit-description').value = book.description;
                        document.getElementById('edit-price').value = book.price;
                        document.getElementById('edit-year').value = book.year;
                        document.getElementById('edit-category').value = book.category;
                        document.getElementById('edit-available').checked = book.available;
                        editBookModal.style.display = 'block';
                    });

                    bookItem.querySelector('.delete-button').addEventListener('click', () => {
                        fetch(`/api/books/${book.id}`, { method: 'DELETE' })
                            .then(() => fetchBooks())
                            .catch(error => console.error('Error deleting book:', error));
                    });
    
                    bookList.appendChild(bookItem);
                });
            })
            .catch(error => console.error('Error fetching books:', error));
    };

    const fetchUsers = () => {
        fetch('/api/users')
            .then(response => response.json())
            .then(users => {
                userList.innerHTML = '';
                users.forEach(user => {
                    const userItem = document.createElement('div');
                    userItem.classList.add('user-item');
    
                    userItem.innerHTML = `
                        <h3>${user.username} (${user.email})</h3>
                        <button class="view-books-button" data-id="${user.id}">View Books</button>
                        <button class="notify-button" data-id="${user.id}">Notify</button>
                    `;
    
                    userItem.querySelector('.view-books-button').addEventListener('click', () => {
                        fetch(`/api/users/${user.id}/books`)
                            .then(response => response.json())
                            .then(books => {
                                userBooksList.innerHTML = '';
                                books.forEach(book => {
                                    const bookItem = document.createElement('div');
                                    bookItem.classList.add('book-item');
    
                                    bookItem.innerHTML = `
                                        <h4>${book.title}</h4>
                                        <p><strong>Author:</strong> ${book.author}</p>
                                        <p><strong>Start Date:</strong> ${new Date(book.start_date).toLocaleDateString()}</p>
                                        <p><strong>End Date:</strong> ${book.end_date ? new Date(book.end_date).toLocaleDateString() : 'N/A'}</p>
                                    `;
    
                                    userBooksList.appendChild(bookItem);
                                });
                                userBooksModal.style.display = 'block';
                            })
                            .catch(error => console.error('Error fetching user books:', error));
                    });

                    userItem.querySelector('.notify-button').addEventListener('click', () => {
                        notificationUserId.value = user.id;
                        notificationForm.style.display = 'block';
                    });
    
                    userList.appendChild(userItem);
                });
            })
            .catch(error => console.error('Error fetching users:', error));
    };

    bookForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const newBook = {
            title: bookForm.title.value,
            author: bookForm.author.value,
            image: bookForm.image.value,
            description: bookForm.description.value,
            price: bookForm.price.value,
            year: parseInt(bookForm.year.value),
            category: bookForm.category.value,
            available: bookForm.available.checked
        };

        fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBook)
        })
        .then(() => {
            fetchBooks();
            bookForm.reset();
        })
        .catch(error => console.error('Error adding book:', error));
    });

    editBookForm.addEventListener('submit', event => {
        event.preventDefault();

        const bookId = document.getElementById('edit-book-id').value;
        const updatedBook = {
            title: document.getElementById('edit-title').value,
            author: document.getElementById('edit-author').value,
            image: document.getElementById('edit-image').value,
            description: document.getElementById('edit-description').value,
            price: document.getElementById('edit-price').value,
            year: parseInt(document.getElementById('edit-year').value),
            category: document.getElementById('edit-category').value,
            available: document.getElementById('edit-available').checked
        };

        fetch(`/api/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBook)
        })
        .then(() => {
            fetchBooks();
            editBookModal.style.display = 'none';
        })
        .catch(error => console.error('Error updating book:', error));
    });

    notificationForm.addEventListener('submit', event => {
        event.preventDefault();

        const userId = notificationUserId.value;
        const message = notificationMessage.value;

        fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, message })
        })
        .then(() => {
            notificationForm.style.display = 'none';
            notificationMessage.value = '';
            alert('Notification sent successfully');
        })
        .catch(error => console.error('Error sending notification:', error));
    });

    booksLink.addEventListener('click', (event) => {
        event.preventDefault();
        booksContainer.style.display = 'block';
        usersContainer.style.display = 'none';
        fetchBooks();
    });

    usersLink.addEventListener('click', (event) => {
        event.preventDefault();
        booksContainer.style.display = 'none';
        usersContainer.style.display = 'block';
        fetchUsers();
    });

    closeUserBooksModal.addEventListener('click', () => {
        userBooksModal.style.display = 'none';
    });

    closeEditBookModal.addEventListener('click', () => {
        editBookModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == userBooksModal || event.target == editBookModal) {
            userBooksModal.style.display = 'none';
            editBookModal.style.display = 'none';
        }
    });

    fetchBooks();
});
