/* Reports use the same scoped, complete medication history as the panel. */
async function gerarPDFMedicacaoPaciente(){try{await window.HarmoniaMedicacao.reportPatient();}catch(e){alert(e.message);}}
async function gerarPDFMedicacaoGeral(){try{await window.HarmoniaMedicacao.report();}catch(e){alert(e.message);}}
