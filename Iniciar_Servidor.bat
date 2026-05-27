@echo off
echo =========================================================
echo  Servidor Local - Tutoriais do Agendamento Facil BR
echo =========================================================
echo.
echo  [+] Iniciando o servidor de testes local...
echo  [+] Servidor ativo em: http://localhost:8000/AgendamentoFacil/ajuda.html
echo.
echo  Abriremos o seu navegador automaticamente em 3 segundos...
echo  Para encerrar o servidor, basta fechar esta janela preta.
echo =========================================================
echo.
timeout /t 3 /nobreak > nul
start http://localhost:8000/AgendamentoFacil/ajuda.html
python -m http.server 8000
