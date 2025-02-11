# Контексты (scope)

Механизм [IntelliSense](https://ru.wikipedia.org/wiki/IntelliSense) строится на основании контекстов, которые хранят и возвращают информацию об окружении: переменные, типы, методы и перечисления.

```mermaid
classDiagram
    editorScope <-- methodScope
    editorScope <-- moduleScope
    editorScope <-- globalScope
    globalScope <-- platformScope
    globalScope <-- yaxunitScope
    globalScope <-- configurationScope

    class editorScope["Контекст редактора"]{
        scopes // Вложенные контексты
    }

    class moduleScope["Контекст модуля"]{
        methods
        variables
    }
    class methodScope["Контекст метода"]{
        variables
    }
    class globalScope["Глобальный контекст"]{
        scopes // Вложенные контексты
    }
    class platformScope["Контекст платформы"]{
        methods
        variables
        types
    }
    class yaxunitScope["Контекст YAxUnit"]{
        methods
        variables
        types
    }
    class configurationScope["Контекст конфигурации"]{
        methods
        variables
        types
    }
```

* [Контекст редактора](/src/bsl/scope/editorScope.ts)
* [Контекст модуля](/src/bsl/scope/localModuleScope.ts)
* [Контекст метода](/src/bsl/scope/methodScope.ts)

* [Глобальный контекст](/src/scope/globalScopeManager.ts)
* [Контекст платформы](/src/bsl/scope/platform)
* [Контекст конфигурации](/src/bsl/scope/configuration)
* [Контекст YAxUnit](/src/yaxunit/scope.ts)
