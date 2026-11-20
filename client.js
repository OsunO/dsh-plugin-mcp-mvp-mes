/**
 * Browser half of the MOM MES connector bundle.
 *
 * Renders the connection form on the bundle's own page in the Plugins panel
 * (Plugins -> MOM MES 连接器). The API key is a credential, not plugin
 * configuration, so this form talks to the Host `remote.credentials` namespace:
 * saving a value writes it into the harness credential store, and the running
 * mcp-client instance resolves the reference again and rebuilds its connection —
 * no DSH restart and no `.env` editing.
 *
 * No secret ever travels back: `describe` reports whether a reference is set,
 * where it comes from, and a masked preview only.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-mcp-mvp-mes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useState } = React;

    /** Locale namespace owned by this plugin. */
    const NS = 'mesMcp';
    /** Bundle package name; also the key of the bundle-configuration slot. */
    const PACKAGE_NAME = 'dsh-plugin-mcp-mvp-mes';
    /** Credential reference the bundle patch substitutes. */
    const API_KEY_REF = 'MOM_MES_API_KEY';
    const REFS = [API_KEY_REF];

    const en = {
      title: 'Connection',
      intro: 'The connector reads the API key from the harness credential store. Saving it rebuilds the MES connection in place, with no restart.',
      apiKeyLabel: 'API key',
      apiKeyHint: 'Sent as the Authorization: Bearer header. Leave empty to keep the stored value.',
      configured: 'Configured',
      notConfigured: 'Not configured',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved. The MES connection is being rebuilt.',
      clear: 'Clear',
      cleared: 'Cleared. The connection stops until a key is set again.',
      failed: 'The Host refused the value.',
      unavailable: 'Credential status is unavailable.',
      reload: 'Reload status',
      liveHint: 'Tools from this server appear as mcp__mvpMes__<tool> once the key resolves.',
    };

    const zh = {
      title: '连接配置',
      intro: '连接器从 Harness 的凭据存储读取 API Key；保存后 MES 连接会自动重建，无需重启 DSH。',
      apiKeyLabel: 'API Key',
      apiKeyHint: '作为 Authorization: Bearer 请求头发送。留空表示沿用已保存的值。',
      configured: '已配置',
      notConfigured: '未配置',
      save: '保存',
      saving: '保存中…',
      saved: '已保存，MES 连接正在重建。',
      clear: '清除',
      cleared: '已清除，连接会在重新配置前保持断开。',
      failed: '宿主拒绝了该值。',
      unavailable: '无法读取凭据状态。',
      reload: '刷新状态',
      liveHint: '该值解析成功后，服务的工具会以 mcp__mvpMes__<工具名> 出现。',
    };

    /** Shared control styling: inherits the host text colour, so light and dark both work. */
    const inputStyle = {
      boxSizing: 'border-box',
      width: '100%',
      padding: '6px 9px',
      font: 'inherit',
      color: 'inherit',
      background: 'transparent',
      border: '1px solid color-mix(in srgb, currentColor 28%, transparent)',
      borderRadius: 6,
      outline: 'none',
    };

    const buttonStyle = {
      font: 'inherit',
      color: 'inherit',
      background: 'transparent',
      border: '1px solid color-mix(in srgb, currentColor 32%, transparent)',
      borderRadius: 6,
      padding: '5px 12px',
      cursor: 'pointer',
    };

    const badgeStyle = {
      fontSize: 12,
      padding: '1px 8px',
      borderRadius: 999,
      border: '1px solid color-mix(in srgb, currentColor 26%, transparent)',
      opacity: 0.8,
      whiteSpace: 'nowrap',
    };

    /**
     * Build the page component bound to one browser plugin context.
     * @param ctx - the browser plugin context (supplies `remote.credentials`).
     * @param t - the dictionary-bound translate function.
     * @returns the component the bundle-configuration slot renders.
     */
    function makePage(ctx, t) {
      return function MesConnectionSection(props) {
        const view = props && props.view;
        const [status, setStatus] = useState('loading');
        const [info, setInfo] = useState({});
        const [error, setError] = useState('');
        const [notice, setNotice] = useState('');
        const [busy, setBusy] = useState(false);
        const [draft, setDraft] = useState('');

        const load = useCallback(async () => {
          try {
            const response = await ctx.remote.credentials.describe(REFS);
            if (response && response.ok) {
              setInfo(response.value || {});
              setStatus('ready');
              setError('');
            } else {
              setStatus('error');
              setError((response && response.error && response.error.message) || t('unavailable'));
            }
          } catch (cause) {
            setStatus('error');
            setError(String((cause && cause.message) || cause));
          }
        }, []);

        useEffect(() => {
          void load();
        }, [load]);

        const write = useCallback(async (value) => {
          setBusy(true);
          setNotice('');
          setError('');
          try {
            const response = value === undefined
              ? await ctx.remote.credentials.unset(API_KEY_REF)
              : await ctx.remote.credentials.set(API_KEY_REF, value);
            if (response && response.ok) {
              setDraft('');
              setNotice(value === undefined ? t('cleared') : t('saved'));
              await load();
            } else {
              setError((response && response.error && response.error.message) || t('failed'));
            }
          } catch (cause) {
            setError(String((cause && cause.message) || cause));
          } finally {
            setBusy(false);
          }
        }, [load]);

        // The bundle-configuration slot only renders the page view; anything else
        // has no one-liner to show.
        if (view !== undefined && view !== 'page') return null;

        const state = info[API_KEY_REF];
        const configured = Boolean(state && state.configured);
        const writable = !state || state.writable !== false;
        const trimmed = draft.trim();
        const idle = busy || trimmed.length === 0 || !writable;

        return h(
          'section',
          { style: { display: 'flex', flexDirection: 'column', gap: 16, padding: '2px 0 10px' } },
          h('div', { style: { fontSize: 13, opacity: 0.75, lineHeight: 1.6 } }, t('intro')),
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
              h('span', { style: { fontWeight: 600 } }, t('apiKeyLabel')),
              h(
                'span',
                { style: badgeStyle },
                configured
                  ? t('configured') + (state && state.masked ? ' · ' + state.masked : '')
                  : t('notConfigured'),
              ),
              h('code', { style: { fontSize: 12, opacity: 0.55 } }, API_KEY_REF),
            ),
            h(
              'div',
              { style: { display: 'flex', gap: 8, alignItems: 'center' } },
              h('input', {
                type: 'password',
                value: draft,
                disabled: !writable,
                autoComplete: 'off',
                spellCheck: false,
                placeholder: configured ? '••••••' : '',
                style: inputStyle,
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' && trimmed.length > 0 && !busy) void write(trimmed);
                },
              }),
              h(
                'button',
                {
                  type: 'button',
                  style: idle ? { ...buttonStyle, opacity: 0.5, cursor: 'default' } : buttonStyle,
                  disabled: idle,
                  onClick: () => {
                    if (trimmed.length > 0) void write(trimmed);
                  },
                },
                busy ? t('saving') : t('save'),
              ),
              configured
                ? h(
                    'button',
                    {
                      type: 'button',
                      style: busy ? { ...buttonStyle, opacity: 0.5 } : buttonStyle,
                      disabled: busy,
                      onClick: () => void write(undefined),
                    },
                    t('clear'),
                  )
                : null,
            ),
            h('div', { style: { fontSize: 12, opacity: 0.6, lineHeight: 1.5 } }, t('apiKeyHint')),
          ),
          notice.length > 0
            ? h('div', { style: { fontSize: 13, lineHeight: 1.5 } }, notice)
            : null,
          error.length > 0
            ? h('div', { style: { fontSize: 13, lineHeight: 1.5, opacity: 0.9 } }, error)
            : null,
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
            h(
              'button',
              {
                type: 'button',
                style: status === 'loading' ? { ...buttonStyle, opacity: 0.5 } : buttonStyle,
                disabled: status === 'loading',
                onClick: () => void load(),
              },
              t('reload'),
            ),
            h('span', { style: { fontSize: 12, opacity: 0.55 } }, t('liveHint')),
          ),
        );
      };
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.credentials'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'mes-mcp: dictionaries');
        const page = makePage(ctx, t);
        ctx.slots.inject('plugins.bundle.config', () =>
          ctx.slots.register(
            { name: 'plugins.bundle.config', key: PACKAGE_NAME, locale: NS },
            page,
          ),
        );
      },
    };
  },
});
