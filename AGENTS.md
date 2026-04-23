Diretivas para execução de benchmarks

- Execute sempre a limpeza de processos nas portas antes de rodas os benchmarks: ex `fuser --kill 3000/tcp ...`

Diretivas para adicionar novos frameworks ao branchmark

- Todos os frameworks deve usar o mesmo arquivo em shared para geraçao de dados
- Todos deve consumir ou retornar os mesmos dados, efetivamente realizando o mesmo trabalho

Diretivas para análize dos resultados

- Todos os branchmarks deve usar os comparativos p95 e p99 assim como metricas de uso de memória RAM e consumo de CPU (load)

