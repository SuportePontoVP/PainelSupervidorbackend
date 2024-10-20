document.addEventListener('DOMContentLoaded', () => {
    const nomeInput = document.getElementById('nome');
    const tipoSelect = document.getElementById('tipo');
    const baterPontoBtn = document.getElementById('baterPonto');
    const tabelaBody = document.getElementById('tabelaBody');
    const paginationDiv = document.getElementById('pagination');

    let pontosSalvos = [];
    let pontosFiltrados = [];
    let paginaAtual = 1;
    const pontosPorPagina = 5;

    
    carregarDadosLocalStorage();

    
    baterPontoBtn.addEventListener('click', (event) => {
        event.preventDefault();
        
        const ponto = capturarDadosPonto();
        if (!ponto) {
            alert('Ops! Algum campo não foi preenchido');
            return;
        }

        fetch('http://localhost:3000/pontos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ponto),
        })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao registrar ponto.');
            return response.json();
        })
        .then(data => {
            console.log('Ponto registrado com sucesso:', data);
            carregarPontos(); 
            tipoSelect.selectedIndex = 0; // Reseta seleção de tipo
        })
        .catch(error => console.error('Erro ao registrar ponto:', error));
    });

    
    function capturarDadosPonto() {
        const nome = nomeInput.value.trim();
        const tipo = tipoSelect.value;
        const data = new Date().toLocaleDateString('pt-BR');
        const hora = new Date().toLocaleTimeString('pt-BR');
        const categoria = document.querySelector('input[name="categoria"]:checked')?.value;

        if (!nome || !tipo || !categoria) return null;

        return { id: Date.now(), nome, categoria, tipo, data, hora };
    }

    function carregarPontos() {
        fetch('http://localhost:3000/pontos')
            .then(response => response.json())
            .then(pontos => {
                pontosSalvos = pontos;
                aplicarFiltros(); 
            })
            .catch(error => console.error('Erro ao carregar pontos:', error));
    }

   
    function atualizarTabela() {
        tabelaBody.innerHTML = '';
        const startIndex = (paginaAtual - 1) * pontosPorPagina;
        const endIndex = startIndex + pontosPorPagina;

        pontosFiltrados.slice(startIndex, endIndex).forEach(ponto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ponto.data}</td>
                <td>${ponto.nome}</td>
                <td>${ponto.categoria}</td>
                <td>${ponto.hora || ''}</td>
                <td>${ponto['Café 1'] || ''}</td>
                <td>${ponto['Retorno Café 1'] || ''}</td>
                <td>${ponto.Almoço || ''}</td>
                <td>${ponto['Retorno Almoço'] || ''}</td>
                <td>${ponto['Café 2'] || ''}</td>
                <td>${ponto['Retorno Café 2'] || ''}</td>
                <td>${ponto.Saída || ''}</td>
            `;
            tabelaBody.appendChild(row);
        });

        atualizarPaginas();
    }

  
    function aplicarFiltros() {
        const nomeFiltro = document.getElementById('filtroNome').value.toLowerCase();
        const tipoColaboradorFiltro = document.getElementById('tipoColaboradorFiltro').value;
        const mesFiltro = document.getElementById('mesFiltro').value;

        pontosFiltrados = pontosSalvos.filter(ponto => {
            const nomeMatch = ponto.nome && ponto.nome.toLowerCase().includes(nomeFiltro);
            const tipoMatch = tipoColaboradorFiltro ? ponto.categoria === tipoColaboradorFiltro : true;
            const mesMatch = mesFiltro ? new Date(ponto.data).getMonth() == mesFiltro : true;
            return nomeMatch && tipoMatch && mesMatch;
        });

        paginaAtual = 1; 
        atualizarTabela(); 
    }

  
    function atualizarPaginas() {
        const totalPaginas = Math.ceil(pontosFiltrados.length / pontosPorPagina);
        paginationDiv.innerHTML = '';

        for (let i = 1; i <= totalPaginas; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerText = i;
            pageButton.classList.add('page-btn');
            pageButton.addEventListener('click', () => {
                paginaAtual = i;
                atualizarTabela();
            });
            paginationDiv.appendChild(pageButton);
        }
    }

   
    function carregarDadosLocalStorage() {
        const dados = localStorage.getItem('pontosSalvos');
        if (dados) {
            pontosSalvos = JSON.parse(dados);
            atualizarTabela();
        }
    }

   
    document.getElementById('exportarExcel').addEventListener('click', () => {
        const filtroNome = document.getElementById('filtroNome1').value.toLowerCase();
        const dataInicio = new Date(document.getElementById('dataInicio1').value);
        const dataFim = new Date(document.getElementById('dataFim1').value);
        const tipoColaboradorFiltro = document.getElementById('tipoColaboradorFiltro1').value;

        const dadosParaExportar = pontosSalvos.filter(ponto => {
            const nomeMatch = ponto.nome && ponto.nome.toLowerCase().includes(filtroNome);
            const dataMatch = (!dataInicio || new Date(ponto.data) >= dataInicio) && (!dataFim || new Date(ponto.data) <= dataFim);
            const tipoMatch = tipoColaboradorFiltro ? ponto.categoria === tipoColaboradorFiltro : true;
            return nomeMatch && dataMatch && tipoMatch;
        });

        if (dadosParaExportar.length === 0) {
            alert('Nenhum dado encontrado para exportar.');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pontos');
        XLSX.writeFile(wb, 'Pontos.xlsx');
    });
});
async function atualizarPontos() {
    try {
        const response = await fetch('http://localhost:3000/pontos'); // Ajuste a URL conforme necessário
        const pontos = await response.json();

        const tbody = document.getElementById('pontosCorpo');
        tbody.innerHTML = ''; // Limpa o corpo da tabela antes de adicionar novos dados

        pontos.forEach(ponto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ponto.Nome}</td>
                <td>${new Date(ponto.Data).toLocaleDateString('pt-BR')}</td>
                <td>${ponto.Categoria}</td>
                <td>${ponto.Entrada}</td>
                <td>${ponto['Café 1'] || '-'}</td>
                <td>${ponto['Retorno Café 1'] || '-'}</td>
                <td>${ponto.Almoço || '-'}</td>
                <td>${ponto['Retorno Almoço'] || '-'}</td>
                <td>${ponto['Café 2'] || '-'}</td>
                <td>${ponto['Retorno Café 2'] || '-'}</td>
                <td>${ponto.Saída || '-'}</td>
                <td>${ponto.HorasTrabalhadas || '0.00'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao atualizar pontos:', error);
    }
}

// Chama a função para carregar os pontos ao carregar a página
document.addEventListener('DOMContentLoaded', atualizarPontos);

// Função para exportar dados para Excel
function exportarParaExcel(pontos) {
    
    const ws = XLSX.utils.json_to_sheet(pontos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pontos");

    
    XLSX.writeFile(wb, "registros_de_ponto.xlsx");
}


document.getElementById('exportarBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/pontos'); 
        const pontos = await response.json();
        exportarParaExcel(pontos);
    } catch (error) {
        console.error('Erro ao exportar pontos:', error);
    }
});
function atualizarPaginas() {
    const totalPaginas = Math.ceil(pontosFiltrados.length / pontosPorPagina);
    paginationDiv.innerHTML = '';

    // Mostrar primeira e anterior
    if (paginaAtual > 1) {
        const primeiraBtn = document.createElement('button');
        primeiraBtn.innerText = 'Primeira';
        primeiraBtn.addEventListener('click', () => {
            paginaAtual = 1;
            atualizarTabela();
        });
        paginationDiv.appendChild(primeiraBtn);

        const anteriorBtn = document.createElement('button');
        anteriorBtn.innerText = 'Anterior';
        anteriorBtn.addEventListener('click', () => {
            paginaAtual--;
            atualizarTabela();
        });
        paginationDiv.appendChild(anteriorBtn);
    }

    // Mostrar 3 páginas ao redor da página atual
    const maxPaginas = Math.min(totalPaginas, 5);
    const startPage = Math.max(1, paginaAtual - 2);
    const endPage = Math.min(totalPaginas, paginaAtual + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.classList.toggle('page-active', i === paginaAtual);

        pageButton.addEventListener('click', () => {
            paginaAtual = i;
            atualizarTabela();
        });

        paginationDiv.appendChild(pageButton);
    }

    // Mostrar próxima e última
    if (paginaAtual < totalPaginas) {
        const proximaBtn = document.createElement('button');
        proximaBtn.innerText = 'Próxima';
        proximaBtn.addEventListener('click', () => {
            paginaAtual++;
            atualizarTabela();
        });
        paginationDiv.appendChild(proximaBtn);

        const ultimaBtn = document.createElement('button');
        ultimaBtn.innerText = 'Última';
        ultimaBtn.addEventListener('click', () => {
            paginaAtual = totalPaginas;
            atualizarTabela();
        });
        paginationDiv.appendChild(ultimaBtn);
    }
}
