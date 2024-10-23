document.addEventListener('DOMContentLoaded', function() {
    const drawButton = document.getElementById('drawButton');
    const winnerDiv = document.getElementById('winner');

    if (drawButton) {
        drawButton.addEventListener('click', function() {
            fetch('/draw', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    winnerDiv.innerHTML = `Ganhador: ${data.name} (${data.email}) - ${data.company}`;
                })
                .catch(error => {
                    console.error('Erro:', error);
                    winnerDiv.innerHTML = 'Ocorreu um erro ao realizar o sorteio.';
                });
        });
    }
});