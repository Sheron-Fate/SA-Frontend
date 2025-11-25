import { resolve } from 'path';
import { generateApi } from 'swagger-typescript-api';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к swagger.json в корне проекта
const swaggerPath = resolve(__dirname, '../../docs/swagger.json');

console.log('📖 Читаю swagger.json из:', swaggerPath);

// Читаем swagger.json
const swaggerContent = JSON.parse(readFileSync(swaggerPath, 'utf-8'));

console.log('🚀 Начинаю генерацию API...');

generateApi({
    name: 'Api.ts',
    output: resolve(__dirname, '../src/api'),
    spec: swaggerContent, // Передаем объект swagger напрямую
    httpClientType: 'axios',
    generateRouteTypes: false,
    generateClient: true,
    generateResponses: true,
    toJS: false,
    extractRequestParams: true,
    extractRequestBody: true,
    extractEnums: true,
    unwrapResponseData: false,
    defaultResponseAsSuccess: false,
    singleHttpClient: true,
    cleanOutput: true,
    enumNamesAsValues: false,
    moduleNameFirstTag: false,
    generateUnionEnums: false,
    extraTemplates: [],
    hooks: {
        onFormatRouteName: (routeInfo, templateRouteName) => {
            return templateRouteName;
        },
    },
})
    .then(({ files, configuration }) => {
        console.log('✅ API успешно сгенерирован!');
        console.log(`📁 Файлы созданы в: ${resolve(__dirname, '../src/api')}`);
        console.log(`📄 Создано файлов: ${files.length}`);
        files.forEach((file) => {
            console.log(`   - ${file.name}`);
        });
    })
    .catch((e) => {
        console.error('❌ Ошибка генерации API:', e);
        if (e.message) {
            console.error('   Сообщение:', e.message);
        }
        if (e.stack) {
            console.error('   Stack:', e.stack);
        }
        process.exit(1);
    });
