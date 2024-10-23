document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const phoneInput = document.getElementById('phone');
    let isSubmitting = false;

    // Formatar o telefone enquanto digita
    phoneInput?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.slice(0, 9);
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{3})?/, '$1-$2');
        }
        e.target.value = value;
    });

    // Prevenir envios duplicados
    const preventDoubleSubmission = async (callback) => {
        if (isSubmitting) return;
        
        isSubmitting = true;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        
        try {
            await callback();
        } finally {
            isSubmitting = false;
            submitButton.disabled = false;
        }
    };

    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        preventDoubleSubmission(async () => {
            try {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);

                // Validação do telefone
                if (data.phone) {
                    const phoneDigits = data.phone.replace(/\D/g, '');
                    if (phoneDigits.length !== 9) {
                        throw new Error('O telefone deve ter 9 dígitos');
                    }
                }

                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Parabéns!',
                        text: result.message
                    });
                    form.reset();
                } else {
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Atenção',
                        text: result.error || 'Erro ao processar cadastro'
                    });
                }
            } catch (error) {
                console.error('Erro:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: error.message || 'Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.'
                });
            }
        });
    });

    // Prevenir envio do form ao pressionar Enter
    form?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
});