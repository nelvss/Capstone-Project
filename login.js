// Login User

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const ownerUser = { username : "owner", password : "owner123"  };
    const staffUser = { username : "staff", password : "staff123"  };

    if (username === ownerUser.username && password === ownerUser.password) {
        alert('Login successful! Redirecting to Owner Dashboard...');
        window.location.href = 'owner_dashboard.html';
    }

    else if (username === staffUser.username && password === staffUser.password) {
        alert('Login successful! Redirecting to Staff Dashboard...');
        window.location.href = 'staff_dashboard.html';
    }
    else {
        alert('Invalid username or password. Please try again.');
    }
}
