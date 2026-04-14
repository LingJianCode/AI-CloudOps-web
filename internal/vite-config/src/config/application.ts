import type { UserConfig } from 'vite';

import type { DefineApplicationOptions } from '../typing';

import path, { relative } from 'node:path';

import { findMonorepoRoot } from '@vben/node-utils';

import { defineConfig, loadEnv, mergeConfig } from 'vite';

import { defaultImportmapOptions, getDefaultPwaOptions } from '../options';
import { loadApplicationPlugins } from '../plugins';
import { loadAndConvertEnv } from '../utils/env';
import { getCommonConfig } from './common';

function createManualChunks(id: string) {
  if (!id.includes('node_modules')) {
    return;
  }

  if (
    id.includes('/node_modules/vue/') ||
    id.includes('/node_modules/vue-router/') ||
    id.includes('/node_modules/pinia/') ||
    id.includes('/node_modules/@vue/') ||
    id.includes('/node_modules/@vueuse/')
  ) {
    return 'framework';
  }

  if (
    id.includes('/node_modules/ant-design-vue/es/table') ||
    id.includes('/node_modules/ant-design-vue/es/tabs') ||
    id.includes('/node_modules/ant-design-vue/es/tree') ||
    id.includes('/node_modules/ant-design-vue/es/vc-table') ||
    id.includes('/node_modules/ant-design-vue/es/vc-tree')
  ) {
    return 'antdv-data';
  }

  if (
    id.includes('/node_modules/ant-design-vue/es/form') ||
    id.includes('/node_modules/ant-design-vue/es/input') ||
    id.includes('/node_modules/ant-design-vue/es/input-number') ||
    id.includes('/node_modules/ant-design-vue/es/select') ||
    id.includes('/node_modules/ant-design-vue/es/checkbox') ||
    id.includes('/node_modules/ant-design-vue/es/radio') ||
    id.includes('/node_modules/ant-design-vue/es/switch')
  ) {
    return 'antdv-form';
  }

  if (
    id.includes('/node_modules/ant-design-vue/es/date-picker') ||
    id.includes('/node_modules/ant-design-vue/es/calendar') ||
    id.includes('/node_modules/ant-design-vue/es/time-picker')
  ) {
    return 'antdv-date';
  }

  if (
    id.includes('/node_modules/ant-design-vue/es/modal') ||
    id.includes('/node_modules/ant-design-vue/es/drawer') ||
    id.includes('/node_modules/ant-design-vue/es/dropdown') ||
    id.includes('/node_modules/ant-design-vue/es/menu') ||
    id.includes('/node_modules/ant-design-vue/es/tooltip') ||
    id.includes('/node_modules/ant-design-vue/es/popover') ||
    id.includes('/node_modules/ant-design-vue/es/tour')
  ) {
    return 'antdv-overlay';
  }

  if (id.includes('/node_modules/ant-design-vue/')) {
    return 'antdv';
  }

  if (
    id.includes('/node_modules/@ant-design/') ||
    id.includes('/node_modules/@ctrl/tinycolor/')
  ) {
    return 'antdv-icons';
  }

  if (
    id.includes('/node_modules/@rc-component/') ||
    id.includes('/node_modules/rc-')
  ) {
    return 'antdv-rc';
  }

  if (id.includes('/node_modules/ant-design-x-vue/')) {
    return 'antdx';
  }

  if (
    id.includes('/node_modules/echarts/') ||
    id.includes('/node_modules/zrender/') ||
    id.includes('/node_modules/@antv/')
  ) {
    return 'charts';
  }

  if (
    id.includes('/node_modules/xlsx/') ||
    id.includes('/node_modules/jszip/') ||
    id.includes('/node_modules/file-saver/')
  ) {
    return 'spreadsheet';
  }

  if (
    id.includes('/node_modules/xterm/') ||
    id.includes('/node_modules/xterm-addon-')
  ) {
    return 'terminal';
  }

  if (
    id.includes('/node_modules/markdown-it/') ||
    id.includes('/node_modules/marked/') ||
    id.includes('/node_modules/dompurify/')
  ) {
    return 'markdown';
  }

  if (
    id.includes('/node_modules/lodash-es/') ||
    id.includes('/node_modules/dayjs/') ||
    id.includes('/node_modules/js-yaml/')
  ) {
    return 'utils';
  }
}

function defineApplicationConfig(userConfigPromise?: DefineApplicationOptions) {
  return defineConfig(async (config) => {
    const options = await userConfigPromise?.(config);
    const { appTitle, base, port, ...envConfig } = await loadAndConvertEnv();
    const { command, mode } = config;
    const { application = {}, vite = {} } = options || {};
    const root = process.cwd();
    const isBuild = command === 'build';
    const env = loadEnv(mode, root);

    const plugins = await loadApplicationPlugins({
      archiver: true,
      archiverPluginOptions: {},
      compress: false,
      compressTypes: ['brotli', 'gzip'],
      devtools: true,
      env,
      extraAppConfig: true,
      html: true,
      i18n: true,
      importmapOptions: defaultImportmapOptions,
      injectAppLoading: true,
      injectMetadata: true,
      isBuild,
      license: true,
      mode,
      nitroMock: !isBuild,
      nitroMockOptions: {},
      print: !isBuild,
      printInfoMap: {
        'Vben Admin Docs': 'https://doc.vben.pro',
      },
      pwa: true,
      pwaOptions: getDefaultPwaOptions(appTitle),
      ...envConfig,
      ...application,
    });

    const { injectGlobalScss = true } = application;

    const applicationConfig: UserConfig = {
      base,
      build: {
        rollupOptions: {
          output: {
            assetFileNames: '[ext]/[name]-[hash].[ext]',
            chunkFileNames: 'js/[name]-[hash].mjs',
            entryFileNames: 'jse/index-[name]-[hash].mjs',
            manualChunks: createManualChunks,
          },
        },
        target: 'es2015',
      },
      css: createCssOptions(injectGlobalScss),
      esbuild: {
        drop: isBuild
          ? [
              // 'console',
              'debugger',
            ]
          : [],
        legalComments: 'none',
      },
      plugins,
      server: {
        host: true,
        port,
        warmup: {
          // 预热文件
          clientFiles: ['./index.html', './src/{views,layouts,router,store}/*'],
        },
      },
    };

    const mergedCommonConfig = mergeConfig(
      await getCommonConfig(),
      applicationConfig,
    );
    return mergeConfig(mergedCommonConfig, vite);
  });
}

function createCssOptions(injectGlobalScss = true) {
  const root = findMonorepoRoot();
  return {
    preprocessorOptions: injectGlobalScss
      ? {
          scss: {
            api: 'modern-compiler',
            additionalData: (content: string, filepath: string) => {
              const relativePath = relative(root, filepath);
              // apps下的包注入全局样式
              if (relativePath.startsWith(`apps${path.sep}`)) {
                return `@use "@vben/styles/global" as *;\n${content}`;
              }
              return content;
            },
          },
        }
      : {},
  };
}

export { defineApplicationConfig };
