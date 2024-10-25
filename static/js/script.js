// Function to open a modal
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Function to close a modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Function to toggle between login and signup forms
function toggleAuth(authType) {
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');

    if (authType === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Signup form validation and submission
document.getElementById('signupFormElement').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    // Clear previous error messages
    document.querySelectorAll('.error-msg').forEach(function (error) {
        error.style.display = 'none';
    });

    var username = document.getElementById('signupUsername').value;
    var email = document.getElementById('signupEmail').value;
    var password = document.getElementById('signupPassword').value;
    var confirmPassword = document.getElementById('signupConfirmPassword').value;
    var profileImage = document.getElementById('signupProfileImage').files[0]; // Get the file

    var isValid = true;

    // Username validation
    if (username.length < 3 || username.length > 15) {
        document.getElementById('signupUsernameError').textContent = 'Username must be between 3 and 15 characters.';
        document.getElementById('signupUsernameError').style.display = 'block';
        isValid = false;
    }

    // Email validation (basic regex)
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(email)) {
        document.getElementById('signupEmailError').textContent = 'Please enter a valid email.';
        document.getElementById('signupEmailError').style.display = 'block';
        isValid = false;
    }

    // Password validation
    if (password.length < 6) {
        document.getElementById('signupPasswordError').textContent = 'Password must be at least 6 characters long.';
        document.getElementById('signupPasswordError').style.display = 'block';
        isValid = false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
        document.getElementById('signupConfirmPasswordError').textContent = 'Passwords do not match.';
        document.getElementById('signupConfirmPasswordError').style.display = 'block';
        isValid = false;
    }

    // If the form is valid, submit it via AJAX using FormData
    if (isValid) {
        var formData = new FormData();  // Create FormData object
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('confirm_password', confirmPassword);
        formData.append('profile_image', profileImage);  // Add the profile image file

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/signup', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                toggleAuth('login');  // Redirect to login form on success
            } else if (xhr.readyState == 4 && xhr.status != 200) {
                console.error(xhr.responseText);  // Log error response for debugging
            }
        };

        xhr.send(formData);  // Send the FormData object with the file and other data
    }
});


document.getElementById('loginFormElement').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Clear previous error messages
    document.querySelectorAll('.error-msg').forEach(function (error) {
        error.style.display = 'none';
    });

    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;

    // AJAX request to login
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/login', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (xhr.responseText === 'Invalid credentials!') {
                document.getElementById('loginUsernameError').textContent = 'Invalid username or password.';
                document.getElementById('loginUsernameError').style.display = 'block';
                document.getElementById('loginPasswordError').textContent = '';
            } else {
                window.location.href = '/';
            }
        }
    };

    // Send form data
    xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
});
