document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort');
    const bookList = document.getElementById('book-list');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const adminLink = document.getElementById('admin-link');
    const booksLink = document.getElementById('books-link');
    const homeLink = document.getElementById('home-link');
    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginFormElement = document.getElementById('login');
    const registerFormElement = document.getElementById('register');
    const transactionModal = document.getElementById('transaction-modal');
    const closeTransactionModal = document.querySelector('.close-transaction');
    const transactionOptions = document.getElementById('transaction-options');
    const rentOptions = document.getElementById('rent-options');
    const purchaseButton = document.getElementById('purchase-button');
    const rentButton = document.getElementById('rent-button');
    const rentForm = document.getElementById('rent-form');
    const notificationModal = document.createElement('div');
    const closeNotificationModal = document.createElement('span');
    const notificationContent = document.createElement('div');
    let selectedBookId = null;
    let userBooks = [];

    let books = [];

    // Notification modal setup
    notificationModal.id = 'notification-modal';
    notificationModal.classList.add('modal');
    closeNotificationModal.classList.add('close-notification');
    closeNotificationModal.innerHTML = '&times;';
    notificationContent.classList.add('modal-content');
    notificationContent.innerHTML = '<h2>Notifications</h2><div id="notifications-list"></div>';
    notificationModal.appendChild(closeNotificationModal);
    notificationModal.appendChild(notificationContent);
    document.body.appendChild(notificationModal);

    const fetchBooks = () => {
        fetch('/api/books')
            .then(response => response.json())
            .then(data => {
                books = data;
                displayBooks(books);
            })
            .catch(error => console.error('Error fetching books:', error));
    };

    const fetchUserBooks = () => {
        fetch('/api/user/books')
            .then(response => response.json())
            .then(data => {
                userBooks = data;
                displayUserBooks(userBooks); // Отображаем только книги пользователя
            })
            .catch(error => console.error('Error fetching user books:', error));
    };

    const fetchNotifications = () => {
        fetch('/api/notifications')
            .then(response => response.json())
            .then(data => {
                const notificationsList = document.getElementById('notifications-list');
                notificationsList.innerHTML = '';
                data.forEach(notification => {
                    const notificationItem = document.createElement('div');
                    notificationItem.classList.add('notification-item');
                    notificationItem.innerHTML = `<p>${notification.message}</p>`;
                    notificationsList.appendChild(notificationItem);

                    // Mark notification as read
                    fetch(`/api/notifications/${notification.id}/read`, {
                        method: 'PUT'
                    });
                });
                if (data.length > 0) {
                    notificationModal.style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching notifications:', error));
    };

    const calculateRemainingDays = (endDate) => {
        const today = new Date();
        const end = new Date(endDate);
        const diffTime = end - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const displayBooks = (booksToDisplay) => {
        bookList.innerHTML = '';
        booksToDisplay.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.classList.add('book-item');

            let description = book.description;
            const words = description.split(' ');
            let shortDescription = description;

            if (words.length > 30) {
                shortDescription = words.slice(0, 30).join(' ') + '... ';
            }

            const isBookOwned = userBooks.some(userBook => userBook.id === book.id);
            const userBook = userBooks.find(userBook => userBook.id === book.id);
            const remainingDays = userBook && userBook.end_date ? calculateRemainingDays(userBook.end_date) : null;

            bookItem.innerHTML = `
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p class="description">${shortDescription}</p>
                ${words.length > 30 ? '<button class="show-more">Показать полностью</button>' : ''}
                <p><strong>Price:</strong> ${book.price}</p>
                <p><strong>Year:</strong> ${book.year}</p>
                <p><strong>Category:</strong> ${book.category}</p>
                ${
                    isBookOwned
                        ? `<p class="owned">Приобретена${remainingDays !== null ? ` (осталось ${remainingDays} дн.)` : ''}</p>`
                        : '<button class="transaction" data-id="' + book.id + '">Purchase/Rent</button>'
                }
            `;

            if (words.length > 30) {
                const showMoreButton = bookItem.querySelector('.show-more');
                showMoreButton.addEventListener('click', () => {
                    const descriptionElement = bookItem.querySelector('.description');
                    if (descriptionElement.innerHTML === shortDescription) {
                        descriptionElement.innerHTML = description;
                        showMoreButton.textContent = 'Скрыть';
                    } else {
                        descriptionElement.innerHTML = shortDescription;
                        showMoreButton.textContent = 'Показать полностью';
                    }
                });
            }

            if (!isBookOwned) {
                const transactionButton = bookItem.querySelector('.transaction');
                transactionButton.addEventListener('click', () => {
                    selectedBookId = book.id;
                    transactionModal.style.display = 'block';
                    transactionOptions.style.display = 'block';
                    rentOptions.style.display = 'none';
                });
            }

            bookList.appendChild(bookItem);
        });
    };

    const displayUserBooks = (booksToDisplay) => {
        bookList.innerHTML = '';
        booksToDisplay.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.classList.add('book-item');

            let description = book.description;
            const words = description.split(' ');
            let shortDescription = description;

            if (words.length > 30) {
                shortDescription = words.slice(0, 30).join(' ') + '... ';
            }

            const userBook = userBooks.find(userBook => userBook.id === book.id);
            const remainingDays = userBook && userBook.end_date ? calculateRemainingDays(userBook.end_date) : null;

            bookItem.innerHTML = `
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p class="description">${shortDescription}</p>
                ${words.length > 30 ? '<button class="show-more">Показать полностью</button>' : ''}
                <p><strong>Price:</strong> ${book.price}</p>
                <p><strong>Year:</strong> ${book.year}</p>
                <p><strong>Category:</strong> ${book.category}</p>
                <p class="owned">Приобретена${remainingDays !== null ? ` (осталось ${remainingDays} дн.)` : ''}</p>
            `;

            if (words.length > 30) {
                const showMoreButton = bookItem.querySelector('.show-more');
                showMoreButton.addEventListener('click', () => {
                    const descriptionElement = bookItem.querySelector('.description');
                    if (descriptionElement.innerHTML === shortDescription) {
                        descriptionElement.innerHTML = description;
                        showMoreButton.textContent = 'Скрыть';
                    } else {
                        descriptionElement.innerHTML = shortDescription;
                        showMoreButton.textContent = 'Показать полностью';
                    }
                });
            }

            bookList.appendChild(bookItem);
        });
    };

    const sortBooks = (criteria) => {
        let sortedBooks = [...books];
        sortedBooks.sort((a, b) => {
            if (a[criteria] < b[criteria]) return -1;
            if (a[criteria] > b[criteria]) return 1;
            return 0;
        });
        displayBooks(sortedBooks);
    };

    const setActiveLink = (linkId) => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(linkId).classList.add('active');
    };

    sortSelect.addEventListener('change', (event) => {
        sortBooks(event.target.value);
    });

    loginLink.addEventListener('click', () => {
        modal.style.display = 'block';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    logoutLink.addEventListener('click', () => {
        fetch('/api/logout', {
            method: 'POST'
        }).then(() => {
            logoutLink.style.display = 'none';
            loginLink.style.display = 'block';
            adminLink.style.display = 'none';
            userBooks = [];
            fetchBooks(); // Переключение обратно на все книги
            setActiveLink('home-link');
        });
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    closeNotificationModal.addEventListener('click', () => {
        notificationModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
        if (event.target == transactionModal) {
            transactionModal.style.display = 'none';
        }
        if (event.target == notificationModal) {
            notificationModal.style.display = 'none';
        }
    });

    showRegisterLink.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    closeTransactionModal.addEventListener('click', () => {
        transactionModal.style.display = 'none';
    });

    purchaseButton.addEventListener('click', () => {
        fetch('/api/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ book_id: selectedBookId, type: 'purchase' })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Purchase successful');
                transactionModal.style.display = 'none';
                fetchUserBooks();
            }
        });
    });

    rentButton.addEventListener('click', () => {
        transactionOptions.style.display = 'none';
        rentOptions.style.display = 'block';
    });

    rentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const duration = rentForm.duration.value;

        fetch('/api/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ book_id: selectedBookId, type: 'rent', duration })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Rent successful');
                transactionModal.style.display = 'none';
                fetchUserBooks();
            }
        });
    });

    loginFormElement.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                modal.style.display = 'none';
                loginLink.style.display = 'none';
                logoutLink.style.display = 'block';

                if (username === 'admin') {
                    window.location.href = 'admin.html'; // Перенаправление на интерфейс администратора
                } else {
                    fetchBooks(); // Загружаем все книги
                    fetchUserBooks(); // Загружаем книги пользователя
                    setActiveLink('home-link'); // Устанавливаем активную ссылку на "Home"
                    fetchNotifications(); // Загружаем уведомления
                }
            }
        });
    });

    registerFormElement.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, confirmPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                modal.style.display = 'none';
                loginLink.style.display = 'none';
                logoutLink.style.display = 'block';

                if (username === 'admin') {
                    window.location.href = 'admin.html'; // Перенаправление на интерфейс администратора
                } else {
                    fetchBooks(); // Загружаем все книги
                    fetchUserBooks(); // Загружаем книги пользователя
                    setActiveLink('home-link'); // Устанавливаем активную ссылку на "Home"
                    fetchNotifications(); // Загружаем уведомления
                }
            }
        });
    });

    // Check if user is authenticated and add admin link if user is admin
    fetch('/api/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                loginLink.style.display = 'none';
                logoutLink.style.display = 'block';
                if (data.user.username === 'admin') {
                    adminLink.style.display = 'inline';
                }
                fetchUserBooks();
                fetchNotifications(); // Загружаем уведомления
            }
            fetchBooks(); // Загружаем все книги в любом случае
        });

    booksLink.addEventListener('click', (event) => {
        event.preventDefault(); // Предотвращаем переход по ссылке
        fetchUserBooks(); // Загружаем книги пользователя
        setActiveLink('books-link'); // Устанавливаем активную ссылку на "Books"
    });

    homeLink.addEventListener('click', (event) => {
        event.preventDefault(); // Предотвращаем переход по ссылке
        fetchBooks(); // Загружаем все книги
        setActiveLink('home-link'); // Устанавливаем активную ссылку на "Home"
    });

    fetchBooks(); // Загружаем все книги при загрузке страницы
});
