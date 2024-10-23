document.addEventListener('DOMContentLoaded', function() {
    const drawButton = document.getElementById('drawButton');
    const winnerDiv = document.getElementById('winner');

    drawButton.addEventListener('click', function() {
        fetch('/draw', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no Sorteio',
                    text: data.error,
                });
            } else if (data.message) {
                Swal.fire({
                    icon: 'info',
                    title: 'Informação',
                    text: data.message,
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Vencedor Sorteado!',
                    html: `
                        <p><strong>Nome:</strong> ${data.name}</p>
                        <p><strong>E-mail:</strong> ${data.email}</p>
                        <p><strong>Telefone:</strong> ${data.phone || 'Não informado'}</p>
                        <p><strong>Empresa:</strong> ${data.company || 'Não informada'}</p>
                    `,
                });
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Ocorreu um erro ao realizar o sorteio. Por favor, tente novamente.',
            });
        });
    });
});