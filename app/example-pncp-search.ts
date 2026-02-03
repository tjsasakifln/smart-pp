/**
 * Exemplo de busca usando PNCPAdapter
 *
 * Para executar:
 * npx tsx example-pncp-search.ts
 */

import { pncpAdapter } from './src/services/datasource/pncpAdapter';
import { dataSourceAggregator } from './src/services/datasource/aggregator';

async function demonstrarBusca() {
  console.log('='.repeat(80));
  console.log('EXEMPLO DE BUSCA - PNCP ADAPTER');
  console.log('='.repeat(80));

  // Exemplo 1: Busca por termo específico
  console.log('\n[EXEMPLO 1] Busca por "serviços de limpeza"');
  console.log('-'.repeat(80));

  try {
    const resultados = await pncpAdapter.search('serviços de limpeza', {
      limit: 10,
      filters: {
        minPrice: 1000,  // Mínimo R$ 1.000
        maxPrice: 100000, // Máximo R$ 100.000
      }
    });

    console.log(`\nEncontrados: ${resultados.length} resultados`);

    if (resultados.length > 0) {
      console.log('\nPrimeiro resultado:');
      const item = resultados[0];
      console.log(`  Descrição: ${item.description.substring(0, 100)}...`);
      console.log(`  Preço: R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`  Unidade: ${item.unit}`);
      console.log(`  Órgão: ${item.organ}`);
      console.log(`  Data: ${item.quotationDate.toLocaleDateString('pt-BR')}`);
      console.log(`  Fonte: ${item.source}`);
    }
  } catch (error) {
    console.error('Erro:', error);
  }

  // Exemplo 2: Busca agregada (múltiplas fontes)
  console.log('\n' + '='.repeat(80));
  console.log('[EXEMPLO 2] Busca agregada - múltiplas fontes');
  console.log('-'.repeat(80));

  try {
    const resultados = await dataSourceAggregator.search('material de escritório', {
      limit: 20,
    });

    console.log(`\nEncontrados: ${resultados.length} resultados (após deduplicação)`);

    // Agrupar por fonte
    const porFonte: Record<string, number> = {};
    resultados.forEach(item => {
      porFonte[item.source] = (porFonte[item.source] || 0) + 1;
    });

    console.log('\nDistribuição por fonte:');
    Object.entries(porFonte)
      .sort((a, b) => b[1] - a[1])
      .forEach(([fonte, qtd]) => {
        console.log(`  ${fonte}: ${qtd} itens`);
      });

    // Estatísticas de preços
    const precos = resultados.filter(r => r.price > 0).map(r => r.price);
    if (precos.length > 0) {
      const media = precos.reduce((a, b) => a + b, 0) / precos.length;
      const min = Math.min(...precos);
      const max = Math.max(...precos);

      console.log('\nEstatísticas de preços:');
      console.log(`  Média: R$ ${media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`  Mínimo: R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`  Máximo: R$ ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
  } catch (error) {
    console.error('Erro:', error);
  }

  console.log('\n' + '='.repeat(80));
}

// Executar demonstração
demonstrarBusca().catch(console.error);
