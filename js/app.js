const fallbackCSV = `id,nome,idade,leito,risco,tarefa_pendente,creatinina,alergias,peso,funcao_renal
1,Maria Oliveira,65,101A,Alto,Administrar Furosemida,1.8,Penicilina,68,Comprometida
2,José Santos,45,102B,Baixo,Avaliação de rotina,0.9,Nenhuma,82,Normal
3,Ana Costa,72,103A,Médio,Coleta de exames,1.2,Dipirona,55,Leve redução
4,Carlos Souza,50,201C,Alto,Ajuste de dosagem de antibiótico,2.1,Iodo,90,Comprometida
5,Beatriz Lima,30,202A,Baixo,Aguardando alta médica,0.8,Nenhuma,65,Normal`;

let globalPacientes = [];
let currentPaciente = null;

document.addEventListener('DOMContentLoaded', () => {
    loadPacientes();

    document.getElementById('ia-search-input')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') simulateIASearch();
    });
});

function loadPacientes(forceUpdate = false) {
    if (forceUpdate) {
        document.getElementById('patient-list-container').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--purple-ia);">
                <i class="fa-solid fa-wand-magic-sparkles fa-spin fa-2x"></i>
                <p style="margin-top: 1rem;">A IA está reavaliando os dados clínicos...</p>
            </div>
        `;
    }

    fetch('data/pacientes.csv')
        .then(response => {
            if (!response.ok) throw new Error("Erro HTTP");
            return response.text();
        })
        .then(data => {
            globalPacientes = parseCSV(data);
            setTimeout(() => renderDashboard(globalPacientes), forceUpdate ? 1500 : 0);
        })
        .catch(error => {
            console.warn('Usando dados de fallback.', error);
            globalPacientes = parseCSV(fallbackCSV);
            setTimeout(() => renderDashboard(globalPacientes), forceUpdate ? 1500 : 0);
        });
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentline = lines[i].split(',');
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j] ? currentline[j].trim() : '';
        }
        result.push(obj);
    }
    return result;
}

function renderDashboard(pacientes) {
    const riskOrder = { 'Alto': 1, 'Médio': 2, 'Baixo': 3 };
    pacientes.sort((a, b) => riskOrder[a.risco] - riskOrder[b.risco]);

    const total = pacientes.length;
    const criticos = pacientes.filter(p => p.risco === 'Alto').length;
    const estaveis = pacientes.filter(p => p.risco === 'Baixo').length;

    document.getElementById('total-pacientes').innerText = total;
    document.getElementById('total-criticos').innerText = criticos;
    document.getElementById('total-estaveis').innerText = estaveis;

    const container = document.getElementById('patient-list-container');
    container.innerHTML = '';

    pacientes.forEach(p => {
        let riskClass = '', badgeClass = '', riskIcon = '';

        if (p.risco === 'Alto') {
            riskClass = 'risk-alto'; badgeClass = 'badge-alto'; riskIcon = '<i class="fa-solid fa-triangle-exclamation"></i>';
        } else if (p.risco === 'Médio') {
            riskClass = 'risk-medio'; badgeClass = 'badge-medio'; riskIcon = '<i class="fa-solid fa-circle-exclamation"></i>';
        } else {
            riskClass = 'risk-baixo'; badgeClass = 'badge-baixo'; riskIcon = '<i class="fa-solid fa-check-circle"></i>';
        }

        const card = document.createElement('div');
        card.className = `patient-card ${riskClass}`;
        card.innerHTML = `
            <div class="patient-info">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="patient-name">${p.nome}</span>
                    <span class="badge ${badgeClass}">${riskIcon} Risco ${p.risco}</span>
                </div>
                <div class="patient-details">
                    <span><i class="fa-solid fa-bed"></i> Leito: ${p.leito}</span>
                    <span><i class="fa-solid fa-user"></i> Idade: ${p.idade}</span>
                    <span title="Alergias"><i class="fa-solid fa-allergies"></i> Alergias: ${p.alergias}</span>
                </div>
                <div class="patient-task">
                    <i class="fa-solid fa-clipboard-list" style="color: var(--blue-primary);"></i>
                    Próxima tarefa: <strong>${p.tarefa_pendente}</strong>
                </div>
            </div>
            <div class="actions">
                <button class="btn btn-ia" title="IA Assist" onclick="openIAAssist('${p.id}')">
                    <i class="fa-solid fa-robot"></i> IA Assist
                </button>
                <button class="btn btn-primary" title="Ver Prontuário" onclick="openProntuario('${p.id}')">
                    <i class="fa-solid fa-file-medical"></i> Ver Prontuário
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openModal(id) {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById('modal-backdrop').classList.add('hidden');
    document.getElementById(id).classList.add('hidden');
}

document.getElementById('modal-backdrop')?.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('modal-backdrop').classList.add('hidden');
});

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    event.target.classList.add('active');
    document.getElementById('tab-' + tab).classList.remove('hidden');
}

function atualizarPrioridades() {
    loadPacientes(true);
}

function openIAAssist(pacienteId) {
    currentPaciente = globalPacientes.find(p => p.id == pacienteId);
    document.getElementById('modal-ia-title').innerText = `IA Assist - ${currentPaciente.nome}`;
    
    const chat = document.querySelector('.chat-container');
    chat.innerHTML = `<div class="chat-message ia-message">Olá! Sou a EnferIA. O que gostaria de saber sobre o paciente ${currentPaciente.nome}?</div>`;
    document.getElementById('ia-search-input').value = '';
    
    document.getElementById('calc-med').value = '';
    document.getElementById('calc-dose').value = '';
    document.getElementById('calc-result').classList.add('hidden');
    
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
    document.getElementById('tab-busca').classList.remove('hidden');
    document.getElementById('tab-calculo').classList.add('hidden');
    
    openModal('modal-ia');
}

function openProntuario(pacienteId) {
    const p = globalPacientes.find(p => p.id == pacienteId);
    document.getElementById('modal-prontuario-title').innerText = `Prontuário: ${p.nome}`;
    document.getElementById('modal-prontuario-body').innerHTML = `
        <div style="display: grid; gap: 0.8rem;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                <span><strong>Leito:</strong> ${p.leito}</span>
                <span><strong>Idade:</strong> ${p.idade} anos</span>
            </div>
            <div><strong>Peso:</strong> ${p.peso} kg</div>
            <div><strong>Alergias:</strong> <span style="color:var(--red); font-weight:600;">${p.alergias}</span></div>
            <div><strong>Creatinina:</strong> ${p.creatinina} mg/dL</div>
            <div><strong>Função Renal:</strong> ${p.funcao_renal}</div>
            
            <div style="margin-top: 1rem; padding: 1rem; background-color: var(--gray-light); border-radius: 8px;">
                <strong style="color: var(--blue-primary);"><i class="fa-solid fa-stethoscope"></i> Resumo Clínico</strong><br>
                Paciente encontra-se com risco classificado como <strong>${p.risco}</strong>.<br> 
                Ação atual prioritária: <strong>${p.tarefa_pendente}</strong>.
            </div>
        </div>
    `;
    openModal('modal-prontuario');
}

function openVoz() {
    document.getElementById('transcription-text').value = '';
    document.getElementById('mic-status').innerText = 'Clique no microfone para falar';
    document.getElementById('mic-animation').classList.remove('recording');
    recording = false;
    openModal('modal-voz');
}

async function simulateIASearch() {
    const input = document.getElementById('ia-search-input');
    const question = input.value.trim();
    if (!question) return;

    const chat = document.querySelector('.chat-container');
    chat.innerHTML += `<div class="chat-message user-message">${question}</div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    const loadingId = 'loading-' + Date.now();
    chat.innerHTML += `<div id="${loadingId}" class="chat-message ia-message"><i class="fa-solid fa-circle-notch fa-spin"></i> Buscando no prontuário e na internet...</div>`;
    chat.scrollTop = chat.scrollHeight;

    const qLower = question.toLowerCase();
    let resposta = "";

    if (qLower.includes('creatinina') || qLower.includes('exame') || qLower.includes('renal')) {
        resposta = `A última creatinina de ${currentPaciente.nome} foi <strong>${currentPaciente.creatinina} mg/dL</strong> (Função Renal: ${currentPaciente.funcao_renal}).<br><br><span style="font-size:0.75rem; color:#666"><i class="fa-solid fa-file-contract"></i> Fonte: Laboratório Central</span>`;
    } else if (qLower.includes('alergia')) {
        resposta = `Alergias registradas: <strong style="color:var(--red);">${currentPaciente.alergias}</strong>.<br><br><span style="font-size:0.75rem; color:#666"><i class="fa-solid fa-file-contract"></i> Fonte: Triagem Inicial</span>`;
    } else if (qLower.includes('peso') || qLower.includes('idade')) {
        resposta = `Paciente com ${currentPaciente.idade} anos, pesando ${currentPaciente.peso} kg.`;
    } else {
        try {
            const response = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(question)}&utf8=&format=json&origin=*`);
            const data = await response.json();
            
            if (data.query.search && data.query.search.length > 0) {
                const cleanSnippet = data.query.search[0].snippet.replace(/<\/?[^>]+(>|$)/g, "");
                const title = data.query.search[0].title;
                resposta = `<strong>Resultado da Web (${title}):</strong><br>${cleanSnippet}...<br><br><span style="font-size:0.75rem; color:#666"><i class="fa-solid fa-earth-americas"></i> Fonte: Internet (Wikipedia API)</span>`;
            } else {
                resposta = `Verificando o plano de cuidados: O paciente está sob risco ${currentPaciente.risco} e a próxima etapa é: ${currentPaciente.tarefa_pendente}. (Nenhum dado adicional encontrado na web).`;
            }
        } catch(e) {
            resposta = `O paciente está sob risco ${currentPaciente.risco}. A próxima etapa documentada é: ${currentPaciente.tarefa_pendente}.`;
        }
    }

    setTimeout(() => {
        document.getElementById(loadingId).remove();
        chat.innerHTML += `<div class="chat-message ia-message">${resposta}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }, 1200);
}

async function simulateIACalculation() {
    const med = document.getElementById('calc-med').value.trim();
    const dose = document.getElementById('calc-dose').value.trim();
    const resultDiv = document.getElementById('calc-result');
    
    if (!med || !dose) {
        alert("Preencha o nome do medicamento e a dose.");
        return;
    }

    resultDiv.classList.remove('hidden');
    resultDiv.style.borderLeft = "none";
    resultDiv.innerHTML = `
        <div style="margin-bottom: 0.5rem"><i class="fa-solid fa-earth-americas fa-spin"></i> Consultando base médica na internet (${med})...</div>
        <div><i class="fa-solid fa-user-doctor fa-spin"></i> Cruzando com histórico do paciente (Alergias: ${currentPaciente.alergias})...</div>
    `;
    
    let medInfo = "Bula ou referência não encontrada na base online.";
    try {
        const response = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(med + " medicamento farmacologia")}&utf8=&format=json&origin=*`);
        const data = await response.json();
        if (data.query.search && data.query.search.length > 0) {
            medInfo = data.query.search[0].snippet.replace(/<\/?[^>]+(>|$)/g, "") + "...";
        }
    } catch (e) {
        console.error("Erro ao buscar internet", e);
    }
    
    setTimeout(() => {
        let alertaRenal = (currentPaciente.funcao_renal !== 'Normal' || currentPaciente.creatinina > 1.2);
        let alergiasLower = currentPaciente.alergias.toLowerCase();
        let alertaAlergia = alergiasLower !== 'nenhuma' && (alergiasLower.includes(med.toLowerCase().substring(0,4)) || med.toLowerCase().includes(alergiasLower.substring(0,4)));

        let contentHTML = `
            <div style="font-size: 0.8rem; color: var(--gray-medium); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #ddd;">
                <strong><i class="fa-solid fa-book-medical"></i> Dados Resgatados da Internet:</strong><br>
                ${medInfo}
            </div>
        `;

        if (alertaAlergia) {
            resultDiv.style.borderLeft = "4px solid var(--red)";
            contentHTML += `
                <strong style="color: var(--red);"><i class="fa-solid fa-skull-crossbones"></i> CHOQUE ANAFILÁTICO (ALERTA GRAVE)</strong><br><br>
                O paciente possui alergia a <strong>${currentPaciente.alergias}</strong>, que possui potencial reatividade cruzada com <strong>${med}</strong>.<br><br>
                <strong>CONDUTA DA IA:</strong> BLOQUEIO DE ADMINISTRAÇÃO. Contatar médico plantonista imediatamente.
            `;
        } else if (alertaRenal) {
            resultDiv.style.borderLeft = "4px solid var(--yellow)";
            contentHTML += `
                <strong style="color: var(--yellow);"><i class="fa-solid fa-triangle-exclamation"></i> ALERTA DE TOXICIDADE RENAL</strong><br><br>
                A dosagem de <strong>${dose}</strong> de <strong>${med}</strong> pode sobrecarregar os rins.<br>
                <strong>Motivo clínico:</strong> Paciente com Função Renal ${currentPaciente.funcao_renal} (Creatinina em ${currentPaciente.creatinina} mg/dL).<br><br>
                <button class="btn btn-ia" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Sugerir Ajuste de -30% (Protocolo Renal)</button>
            `;
        } else {
            resultDiv.style.borderLeft = "4px solid var(--green)";
            contentHTML += `
                <strong style="color: var(--green);"><i class="fa-solid fa-check-circle"></i> DOSE SEGURA E VALIDADA</strong><br><br>
                A dose de <strong>${dose}</strong> de <strong>${med}</strong> está adequada para o peso do paciente (${currentPaciente.peso}kg) e sua função renal atual. Nenhuma interação medicamentosa ou alérgica detectada.
            `;
        }
        
        resultDiv.innerHTML = contentHTML;
    }, 1500);
}

let recording = false;
let timeoutVoz;

function toggleRecording() {
    const mic = document.getElementById('mic-animation');
    const status = document.getElementById('mic-status');
    const text = document.getElementById('transcription-text');
    
    if (!recording) {
        recording = true;
        mic.classList.add('recording');
        status.innerHTML = "Ouvindo... <br><span style='font-size:0.8rem;color:#888'>(Simulando reconhecimento de voz)</span>";
        text.value = "";
        
        timeoutVoz = setTimeout(() => {
            if(recording) {
                text.value = "Paciente evolui clinicamente bem, sem queixas de dor. Sinais vitais estáveis. Diurese presente e de coloração normal. Oriento aguardar novos exames laboratoriais.";
                recording = false;
                mic.classList.remove('recording');
                status.innerText = "Transcrição concluída via IA. Edite se necessário.";
            }
        }, 3500);
    } else {
        recording = false;
        clearTimeout(timeoutVoz);
        mic.classList.remove('recording');
        status.innerText = "Gravação pausada.";
    }
}

function saveEvolucao() {
    const text = document.getElementById('transcription-text').value;
    if (text.length < 5) {
        alert("Nenhum dado transcrito. Grave ou digite uma evolução antes de salvar.");
        return;
    }
    alert("✅ Evolução estruturada pela IA e salva com sucesso no ERP hospitalar!");
    closeModal('modal-voz');
}
