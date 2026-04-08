# dropbox-project

Processo de automação de backup dropbox dos projetos PVAX

## Proposito

Esse código serviu para fazer uma automação de backup de arquivos de outro sistema interno, tinhamos que ficar enviando diariamente arquivos zip para a nuvem que podiam ser pequenos (entre 3MB) ou enormes (entre 1GB a 10GB), um processo manual que acaba tomando muito tempo de produção que poderia ser utilizado para qualquer outra tarefa.

Como o sistema gerava esses arquivos de backup na virada do dia, ter um sistema que realiza esse upload sozinho assim que presente seria bom, cada pessoa da equipe então começou a criar sua solução utilizando linguagens diferentes e essa foi a minha.

## Utilização

Esse código é antigo, desatualizado e não recebe manutenção, as APIs no qual ele interage provavelmente já mudaram, mas vou anotar aqui o que lembro sobre esse código.

Primeiro temos que atualizar o *config.json*:

```JSON
{
    "baseFolder": "",
    "cloudBaseFolder": "",
    "specificPaths": {
        "SESRJ/Agendamento": ""
    }
}
```

#### baseFolder

A propriedade `baseFolder` define o caminho da pasta base de onde vamos pegar os arquivos (do nosso sistema local).

#### cloudBaseFolder

A propriedade `cloudBaseFolder` define o caminho da pasta no Dropbox onde vamos armazenar os arquivos transferidos.

#### specificPaths

A propriedade `specificPaths` é um objeto que aceita o caminho local de pastas como chave e o caminho na nuvem que essa pasta deve ser armazenada. Por exemplo, caso a pasta especificada no `baseFolder` tenha uma pasta chamada "foo" então dentro de `specificPaths` você pode adicionar uma propriedade "foo" que vai ir para pasta "bar".


### Exemplo

```JSON
{
    "baseFolder": "H:/Dev/dropbox-project/transfer/",
    "cloudBaseFolder": "/backup_bd/some db/",
    "specificPaths": {
        "MYCOMPANY/Agendamento": "/MYCOMPANY/Agendamento"
    }
}
```

---

Também é necessário criar um arquivo `.env` definir variaveis de operação, as entradas necessárias estão listadas no `env.example`.