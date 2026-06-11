document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.editor-area').forEach(editor => {
        editor.setAttribute('spellcheck', 'false');
        editor.setAttribute('data-gramm', 'false');
        editor.setAttribute('data-gramm_editor', 'false');
        editor.setAttribute('data-enable-grammarly', 'false');
    });

    document.addEventListener('input', (e) => {

        const editor = e.target.closest('.editor-area');

        if (!editor) return;

        const hidden =
            document.getElementById(editor.id + '_input');

        if (hidden) {
            hidden.value = editor.innerHTML;
        }

    });

    const getEditor = (id) => document.getElementById(id);

    const exec = (editor, cmd, value = null) => {
        editor.focus();
        document.execCommand(cmd, false, value);
    };

    const sanitizePastedHtml = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const proofingClasses = [
            'GramE',
            'SpellE',
            'MsoProofingErrors',
            'scayt-misspell-word',
            'scayt-misspell',
            'GINGER_SOFTWARE_mark'
        ];

        doc.body.querySelectorAll('*').forEach((el) => {
            proofingClasses.forEach(className => el.classList.remove(className));

            [...el.attributes].forEach((attr) => {
                const name = attr.name.toLowerCase();
                const value = attr.value.toLowerCase();

                if (
                    name.startsWith('data-gramm') ||
                    name.startsWith('data-mce') ||
                    name.startsWith('data-cke') ||
                    name === 'spellcheck' ||
                    name === 'lang' ||
                    name === 'xml:lang' ||
                    name === 'class' && !el.className.trim()
                ) {
                    el.removeAttribute(attr.name);
                }

            });

            if (!el.hasAttribute('style')) return;

            const style = el.style;
            [...style].forEach((property) => {
                if (property.startsWith('mso-')) {
                    style.removeProperty(property);
                }
            });

            const textDecoration = [
                style.textDecoration,
                style.textDecorationLine,
                style.textDecorationStyle,
                style.textDecorationColor,
                style.borderBottom,
                style.borderBottomColor
            ].join(' ').toLowerCase();

            if (/wavy|spell|grammar|red|#f00|rgb\(255,\s*0,\s*0\)|green|#008000/.test(textDecoration)) {
                style.removeProperty('text-decoration');
                style.removeProperty('text-decoration-line');
                style.removeProperty('text-decoration-style');
                style.removeProperty('text-decoration-color');
                style.removeProperty('border-bottom');
                style.removeProperty('border-bottom-color');
                style.removeProperty('border-bottom-style');
                style.removeProperty('border-bottom-width');
            }

            if (style.background && !style.backgroundColor) {
                style.backgroundColor = style.background;
            }
        });

        return doc.body.innerHTML;
    };

    document.addEventListener('paste', (e) => {
        const editor = e.target.closest('.editor-area');
        if (!editor) return;

        const html = e.clipboardData && e.clipboardData.getData('text/html');
        const text = e.clipboardData && e.clipboardData.getData('text/plain');

        if (!html && !text) return;

        e.preventDefault();
        exec(editor, 'insertHTML', html ? sanitizePastedHtml(html) : text.replace(/\n/g, '<br>'));
    });

    /* CLICK HANDLER */
    document.addEventListener('click', (e) => {

        const btn = e.target.closest('[data-target]');
        if (!btn) return;

        const editor = getEditor(btn.dataset.target);
        if (!editor) return;

        /* COMMAND BUTTONS */
        if (btn.classList.contains('execCmd')) {
            exec(editor, btn.dataset.command);
        }

        /* LINK */
        if (btn.classList.contains('insertLink')) {
            const url = prompt("Enter URL:");
            if (url) exec(editor, 'createLink', url);
        }

        /* TABLE */
        if (btn.classList.contains('insertTable')) {
            const rows = parseInt(prompt("Rows?", 2));
            const cols = parseInt(prompt("Columns?", 2));
            if (!rows || !cols) return;

            let table = "<table><tbody>";
            for (let r = 0; r < rows; r++) {
                table += "<tr>";
                for (let c = 0; c < cols; c++) table += "<td>Cell</td>";
                table += "</tr>";
            }
            table += "</tbody></table>";

            exec(editor, 'insertHTML', table);
        }
        console.log(e.target);

        /* IMAGE */
        if (btn.classList.contains('insertImage')) {

            const imageUrl = prompt("Image URL:");
            if (!imageUrl) return;

            const alt = prompt("Alt Text:", "") || '';

            const title = prompt("Title:", "") || '';

            const redirectUrl = prompt("Redirect URL (optional):", "") || '';

            let html = '';

            if (redirectUrl) {

                html = `
        <div class="media-wrapper">

            <a href="${redirectUrl}"
               target="_blank">

                <img src="${imageUrl}"
                     alt="${alt}"
                     title="${title}">

            </a>

            <div class="resize-handle"></div>

        </div>
        `;

            } else {

                html = `
        <div class="media-wrapper">

            <img src="${imageUrl}"
                 alt="${alt}"
                 title="${title}">

            <div class="resize-handle"></div>

        </div>
        `;
            }

            exec(editor, 'insertHTML', html);
        }

        /* VIDEO */
        if (btn.classList.contains('insertVideo')) {
            const url = prompt("YouTube URL:");
            if (!url) return;

            let videoId = '';
            const match = url.match(/(?:youtu\.be\/|watch\?v=)([^&]+)/);
            if (match) videoId = match[1];

            if (!videoId) {
                alert("Invalid YouTube URL");
                return;
            }

            exec(editor, 'insertHTML', `
                    <div class="media-wrapper video-wrapper" style="width:400px;">
                        <div class="video-inner">
                            <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        </div>
                        <div class="resize-handle"></div>
                    </div>
                `);
        }


        /* CODE VIEW */
        if (btn.classList.contains('toggleCode')) {
            editor.dataset.code = editor.dataset.code === 'true' ? 'false' : 'true';
            editor.innerHTML = editor.dataset.code === 'true' ?
                editor.textContent :
                editor.innerHTML;
        }
    });

    /* CHANGE HANDLER */
    document.addEventListener('change', (e) => {

        const editor = getEditor(
            e.target.dataset && e.target.dataset.target
        );
        if (!editor) return;

        if (e.target.classList.contains('formatBlock'))
            exec(editor, 'formatBlock', e.target.value);

        if (e.target.classList.contains('fontName'))
            exec(editor, 'fontName', e.target.value);

        if (e.target.classList.contains('fontSize'))
            exec(editor, 'fontSize', e.target.value);

        if (e.target.classList.contains('foreColor'))
            exec(editor, 'foreColor', e.target.value);

        if (e.target.classList.contains('backColor'))
            exec(editor, 'hiliteColor', e.target.value);

        if (e.target.classList.contains('insertColumns')) {
            const count = parseInt(e.target.value);
            if (!count) return;

            let html = `<div class="editor-columns">`;
            for (let i = 1; i <= count; i++)
                html += `<div class="editor-column" contenteditable="true">Column ${i}</div>`;
            html += `</div>`;

            exec(editor, 'insertHTML', html);
            e.target.value = '';
        }
    });

    /* IMAGE RESIZE */
    let activeWrapper = null,
        startX = 0,
        startWidth = 0;

    document.addEventListener('mousedown', e => {
        if (!e.target.classList.contains('resize-handle')) return;
        activeWrapper = e.target.parentElement;
        startX = e.pageX;
        startWidth = activeWrapper.offsetWidth;

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    });

    const resize = (e) => {
        if (!activeWrapper) return;
        const newWidth = startWidth + (e.pageX - startX);
        if (newWidth > 100) activeWrapper.style.width = newWidth + "px";
    };

    const stopResize = () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        activeWrapper = null;
    };

    /* SELECT IMAGE */
    document.addEventListener('click', e => {
        document.querySelectorAll('.media-wrapper')
            .forEach(el => el.classList.remove('selected'));

        const wrapper = e.target.closest('.media-wrapper');
        if (wrapper) wrapper.classList.add('selected');
    });

    /* SUBMIT SYNC */
    document.addEventListener('submit', () => {
        document.querySelectorAll('.editor-area').forEach(editor => {
            const hidden = document.getElementById(editor.id + '_input');
            if (hidden) hidden.value = editor.innerHTML;
        });
    });

    document.querySelectorAll('.editor-toolbar *').forEach(el => el.tabIndex = -1);

    document.querySelectorAll('.rich-editor')
        .forEach(container => {

            const id =
                container.dataset.id ||
                ('editor_' + Date.now());

            const name =
                container.dataset.name ||
                'content';

            const value =
                container.dataset.value ||
                '';

            container.innerHTML =
                buildEditor(id, name, value);
        });
});

function buildEditor(id, name, value = '') {

    return `
    <div class="editor-wrapper">

        <div class="editor-toolbar">

            <select class="formatBlock" data-target="${id}">
                <option value="p">Paragraph</option>
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="h4">H4</option>
                <option value="h5">H5</option>
                <option value="h6">H6</option>
            </select>

            <select class="fontName" data-target="${id}">
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times</option>
                <option value="Courier New">Courier</option>
            </select>

            <select class="fontSize" data-target="${id}">
                <option value="2">Small</option>
                <option value="3" selected>Normal</option>
                <option value="4">Medium</option>
                <option value="5">Large</option>
                <option value="6">X-Large</option>
            </select>

            <input type="color" class="foreColor" data-target="${id}">
            <input type="color" class="backColor" data-target="${id}">

            
        <button type="button" class="execCmd" data-command="bold" data-target="${id}" title="Bold"><i class="fa fa-bold"></i></button>
        <button type="button" class="execCmd" data-command="italic" data-target="${id}" title="Italic"><i class="fa fa-italic"></i></button>
        <button type="button" class="execCmd" data-command="underline" data-target="${id}" title="Underline"><i class="fa fa-underline"></i></button>
        <button type="button" class="execCmd" data-command="strikeThrough" data-target="${id}" title="Strikethrough"><i class="fa fa-strikethrough"></i></button>

        <button type="button" class="execCmd" data-command="justifyLeft" data-target="${id}" title="Justify Left"><i class="fa fa-align-left"></i></button>
        <button type="button" class="execCmd" data-command="justifyCenter" data-target="${id}" title="Justify Center"><i class="fa fa-align-center"></i></button>
        <button type="button" class="execCmd" data-command="justifyRight" data-target="${id}" title="Justify Right"><i class="fa fa-align-right"></i></button>

        <button type="button" class="execCmd" data-command="insertUnorderedList" data-target="${id}" title="Unordered List"><i class="fa fa-list-ul"></i></button>
        <button type="button" class="execCmd" data-command="insertOrderedList" data-target="${id}" title="Ordered List"><i class="fa fa-list-ol"></i></button>

        <button type="button" class="insertLink" data-target="${id}" title="Insert Link"><i class="fa fa-link"></i></button>
        <button type="button" class="insertTable" data-target="${id}" title="Insert Table"><i class="fa fa-table"></i></button>
        <button type="button" class="insertImage" data-target="${id}" title="Insert Image"><i class="fa fa-image"></i></button>
        <button type="button" class="insertVideo" data-target="${id}" title="Insert Video"><i class="fa fa-video"></i></button>

        <select class="insertColumns" data-target="${id}">
            <option value="">Columns</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
        </select>

        <button type="button" class="toggleCode" data-target="${id}"><i class="fa fa-code"></i></button>

    </div>

    <div id="${id}"
        contenteditable="true"
        class="editor-area"
        spellcheck="false"
        autocorrect="off"
        autocomplete="off"
        autocapitalize="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false">
        ${value}
    </div>

    <input type="hidden"
           name="${name}"
           id="${id}_input"
           >

    </div>
    `;
}