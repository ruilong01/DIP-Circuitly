import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["docs/js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                localStorage: "readonly",
                alert: "readonly",
                confirm: "readonly",
                fetch: "readonly",
                State: "readonly",
                ROUTES: "readonly",
                MathJax: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                btoa: "readonly",
                FileReader: "readonly",
                location: "readonly",
                Chart: "readonly",
                XLSX: "readonly",
                localStorage: "readonly",
                console: "readonly",
                saveState: "readonly",
                loadState: "readonly"
            }
        },
        rules: {
            "no-undef": "warn",
            "no-unused-vars": "off",
            "no-global-assign": "off"
        }
    }
];
