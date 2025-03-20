let dions = 0;
let clicks = 0;
let autoClickActive = false;
let multiplierActive = false;
let walletAddress = null;

let dailyLimit = 1000000; // Daily DION limit
let emittedToday = 0; // Dions emitted today
const emissionResetHour = 0; // Hour at which the daily emission resets
let dailyClicksLimit = 100; // Daily click limit per user
let userClicksToday = 0; // Clicks made by the user today

document.addEventListener('DOMContentLoaded', () => {
    const dionsCounter = document.getElementById('dions-counter');
    const clickButton = document.getElementById('click-button');
    const connectWalletButton = document.getElementById('connect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const autoClickButton = document.getElementById('auto-click');
    const multiplierButton = document.getElementById('multiplier');
    const tutorialModal = document.getElementById('tutorial-modal');
    const closeButton = document.querySelector('.close-button');
    const dailyLimitInfo = document.getElementById('daily-limit-info');
    const upgradeNotification = document.getElementById('upgrade-notification');

    let autoClickCount = 0; // Counter for auto-click upgrades
    const autoClickLimit = 3; // Limit of auto-click upgrades

    let multiplierCount = 0; // Counter for multiplier upgrades
    const multiplierLimit = 3; // Limit of multiplier upgrades

    // Function to show upgrade notifications
    function showUpgradeNotification(message) {
        upgradeNotification.textContent = message;
        upgradeNotification.style.display = 'block';
        setTimeout(() => {
            upgradeNotification.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    }

    // Function to create floating text
    function createFloatingText(message) {
        const floatingText = document.createElement('div');
        floatingText.classList.add('floating-text');
        floatingText.textContent = message;
        clickButton.appendChild(floatingText);
        floatingText.addEventListener('animationend', () => floatingText.remove());
    }

    // Function to update the daily limit counter
    function updateCounter() {
        dailyLimitInfo.textContent = `DIONS emitidos hoy: ${emittedToday}/${dailyLimit}`;
    }

    // Function to check and reset the daily limit if needed
    function checkDailyReset() {
        const now = new Date();
        if (localStorage.getItem('lastResetDate')) {
            const lastResetDate = new Date(localStorage.getItem('lastResetDate'));
            if (now.getDate() !== lastResetDate.getDate()) {
                emittedToday = 0;
                localStorage.setItem('lastResetDate', now.toDateString());
                updateCounter();
            }
        } else {
            localStorage.setItem('lastResetDate', now.toDateString());
        }
    }

    // Function to update the daily clicks counter
    function updateClicksCounter() {
        dailyLimitInfo.textContent = `DIONS emitidos hoy: ${emittedToday}/${dailyLimit} | Clics restantes: ${dailyClicksLimit - userClicksToday}`;
    }

    // Function to check and reset the daily click limit if needed
    function checkDailyClicksReset() {
        const now = new Date();
        if (localStorage.getItem('lastClicksResetDate')) {
            const lastClicksResetDate = new Date(localStorage.getItem('lastClicksResetDate'));
            if (now.getDate() !== lastClicksResetDate.getDate()) {
                userClicksToday = 0;
                localStorage.setItem('lastClicksResetDate', now.toDateString());
                updateClicksCounter();
            }
        } else {
            localStorage.setItem('lastClicksResetDate', now.toDateString());
        }
    }

    // Function to check if auto-click limit is reached
    function isAutoClickLimitReached() {
        return autoClickCount >= autoClickLimit;
    }

    // Function to check if multiplier limit is reached
    function isMultiplierLimitReached() {
        return multiplierCount >= multiplierLimit;
    }

    // Function to update button states
    function updateButtonStates() {
        autoClickButton.disabled = autoClickActive || dions < 50 || isAutoClickLimitReached();
        multiplierButton.disabled = multiplierActive || dions < 100 || isMultiplierLimitReached();

        if (isAutoClickLimitReached()) {
            autoClickButton.textContent = 'Auto-clic (Max)';
        } else {
            autoClickButton.textContent = 'Auto-clic (50 DIONS)';
        }

        if (isMultiplierLimitReached()) {
            multiplierButton.textContent = 'Multiplicador x2 (Max)';
        } else {
            multiplierButton.textContent = 'Multiplicador x2 (100 DIONS)';
        }
    }

    // Initialize the counter and check for reset on page load
    checkDailyReset();
    checkDailyClicksReset();
    updateClicksCounter();
    updateButtonStates();

    if (!localStorage.getItem('tutorialShown')) {
        tutorialModal.style.display = 'block';
        localStorage.setItem('tutorialShown', 'true');
    }

    closeButton.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === tutorialModal) {
            tutorialModal.style.display = 'none';
        }
    });

    clickButton.addEventListener('click', () => {
        if (userClicksToday < dailyClicksLimit) {
            let increment = 1;
            if (multiplierActive) {
                increment *= 2;
                createFloatingText('x2');
            }

            if (emittedToday + increment <= dailyLimit) {
                clicks++;
                userClicksToday++;
                dions += increment;
                emittedToday += increment; // Update emitted DIONS
                dionsCounter.textContent = `DIONS: ${dions}`;
                updateClicksCounter(); // Update the displayed counter
                updateButtonStates();

                if (clicks % 100 === 0) {
                    sendDionsToWallet();
                }
            } else {
                alert('Se alcanzó el límite diario de DIONS.');
            }
        } else {
            alert('Has alcanzado el límite de clics diarios.');
        }
    });

    connectWalletButton.addEventListener('click', async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                walletAddress = accounts[0];
                walletAddressDisplay.textContent = `Billetera conectada: ${walletAddress}`;
                connectWalletButton.disabled = true;
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
                walletAddressDisplay.textContent = "Error al conectar la billetera.";
            }
        } else {
            walletAddressDisplay.textContent = "MetaMask no está instalado.";
        }
    });

    autoClickButton.addEventListener('click', () => {
        if (dions >= 50 && !autoClickActive && !isAutoClickLimitReached()) {
            if (emittedToday + 50 <= dailyLimit) {
                dions -= 50;
                emittedToday += 50;
                dionsCounter.textContent = `DIONS: ${dions}`;
                updateClicksCounter();
                autoClickActive = true;
                autoClickButton.disabled = true;
                showUpgradeNotification('¡Auto clic activado!');
                updateButtonStates();
                autoClickCount++;
                setInterval(() => {
                    let increment = 1;
                    if (multiplierActive) {
                        increment *= 2;
                    }
                    if (emittedToday + increment <= dailyLimit && userClicksToday < dailyClicksLimit) {
                        dions += increment;
                        clicks++;
                        userClicksToday++;
                        emittedToday += increment;
                        dionsCounter.textContent = `DIONS: ${dions}`;
                        updateClicksCounter();
                        updateButtonStates();
                        if (clicks % 100 === 0) {
                            sendDionsToWallet();
                        }
                    } else {
                        if (emittedToday + increment > dailyLimit) {
                            alert('Se alcanzó el límite diario de DIONS.');
                        } else {
                            alert('Has alcanzado el límite de clics diarios.');
                        }
                    }
                }, 1000);
            } else {
                alert('Se alcanzó el límite diario de DIONS.');
            }
        } else {
            alert('No tienes suficientes DIONS o la mejora ya está activa.');
        }
    });

    multiplierButton.addEventListener('click', () => {
        if (dions >= 100 && !multiplierActive && !isMultiplierLimitReached()) {
            if (emittedToday + 100 <= dailyLimit) {
                dions -= 100;
                emittedToday += 100;
                dionsCounter.textContent = `DIONS: ${dions}`;
                updateClicksCounter();
                multiplierActive = true;
                multiplierButton.disabled = true;
                showUpgradeNotification('¡Multiplicador x2 activado!');
                updateButtonStates();
                multiplierCount++;
            } else {
                alert('Se alcanzó el límite diario de DIONS.');
            }
        } else {
            alert('No tienes suficientes DIONS o la mejora ya está activa.');
        }
    });

    async function sendDionsToWallet() {
        if (walletAddress) {
            console.log(`Simulating sending ${dions} DIONS to ${walletAddress}`);
            alert(`Enviando ${dions} DIONS a tu billetera! (Simulado). Actualmente 1 DION = $0.01 USD, estamos trabajando para habilitar el canje real por USDT`);

            dions = 0;
            dionsCounter.textContent = `DIONS: ${dions}`;
            updateButtonStates();
        } else {
            alert('Por favor, conecta tu billetera MetaMask primero.');
        }
    }
});
