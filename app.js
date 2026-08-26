let MASTER_DATA = null;
let CURRENT_TAB = 'entities'; 
let PREVIOUS_VIEW = null; 
let CURRENT_ACTIVE_ID = null;

const ENUM_TYPOLOGY = {
  'substantive_power': 'Substantive Power',
  'duty_obligation': 'Duty & Obligation',
  'fundamental_right': 'Fundamental Right / Entitlement',
  'declaratory_policy': 'Declaratory / Policy',
  'procedural': 'Procedural Rules',
  'definitional_interpretative': 'Definitional & Interpretative',
  'creation_or_definition': 'Creation & Definition',
  'checks_or_limits': 'Checks & Limits',
  'ouster_immunity': 'Ouster of Jurisdiction & Immunity',
  'transitional_validation': 'Transitional & Historical Validation'
};

const ENUM_TYPOLOGY_OVERVIEW = {
  'substantive_power': 'These clauses hand someone the authority to act — to decide, appoint, order, or approve something.',
  'duty_obligation': 'These clauses say "shall" — they command an actor to do something, with no room to choose otherwise.',
  'fundamental_right': 'These clauses give ordinary people or citizens an entitlement the state must respect.',
  'declaratory_policy': 'These clauses state a goal or principle rather than a rule — often not enforceable in court on their own.',
  'procedural': 'These clauses set out the mechanics of a process: timelines, voting steps, how a bill or budget moves.',
  'definitional_interpretative': 'These clauses define a word, term, calendar, or how another clause should be read.',
  'creation_or_definition': 'These clauses formally establish a body, office, or court that didn\'t exist before.',
  'checks_or_limits': 'These clauses restrict a power already granted elsewhere — a cap, a condition, or a disqualification.',
  'ouster_immunity': 'These clauses block courts from reviewing a decision, or shield an actor from legal consequences.',
  'transitional_validation': 'These clauses validate something that already happened, or bridge the gap during a change in law.'
};

const ENUM_THEME_OVERVIEW = {
  'fundamental_rights': 'Civil liberties and legal safeguards belonging to individuals — equality, speech, fair trial, and similar protections.',
  'general_executive': 'The President, Prime Minister, Cabinets, and Governors — how the executive branch is run.',
  'general_legislative': 'Parliament, the National Assembly, the Senate, and Provincial Assemblies — how laws get made.',
  'judicial_process': 'The courts: how judges are appointed, and what powers courts have to hear and decide cases.',
  'federalism_devolution': 'How power and resources are split between the federal government and the provinces.',
  'public_finance_taxation': 'Government money — budgets, funds, borrowing, and how revenue is shared.',
  'elections_democracy': 'How elections are run, who can vote, and the rules political parties and candidates follow.',
  'national_security_emergency': 'The armed forces, treason, and what happens when a state of emergency is declared.',
  'islamic_injunctions': 'Provisions tying law to Islamic principles, including the Council of Islamic Ideology and Federal Shariat Court.',
  'civil_service_administration': 'The government workforce — public service commissions and how civil servants are managed.',
  'meta_law_interpretation': 'Ground rules for the Constitution itself — definitions, when it takes effect, and how repeals work.'
};

const ENUM_THEME = {
  'fundamental_rights': 'Fundamental Rights',
  'general_executive': 'The Executive',
  'general_legislative': 'The Legislature',
  'judicial_process': 'Judicial Process & Courts',
  'federalism_devolution': 'Federalism & Devolution',
  'public_finance_taxation': 'Public Finance & Taxation',
  'elections_democracy': 'Elections & Democracy',
  'national_security_emergency': 'National Security & Emergency',
  'islamic_injunctions': 'Islamic Injunctions',
  'civil_service_administration': 'Civil Service & Administration',
  'meta_law_interpretation': 'Meta-Law & Interpretation'
};

const CATEGORY_MAP = [
  { key: 'creation_or_definition', label: 'Creation & Definition' },
  { key: 'appointment_or_selection', label: 'Appointment & Selection' },
  { key: 'powers', label: 'Powers' },
  { key: 'duties_or_responsibilities', label: 'Duties & Responsibilities' },
  { key: 'checks_or_limits', label: 'Checks & Limits' },
  { key: 'removal_or_end_of_term', label: 'Removal & End of Term' },
  { key: 'application_or_scope', label: 'Application & Scope' },
  { key: 'uncategorized', label: 'Other Provisions' }
];

async function initializeApp() {
  try {
    const res = await fetch('constitution_of_pakistan.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    MASTER_DATA = await res.json();
  } catch (e) {
    console.warn("Could not load constitution_of_pakistan.json:", e);
    document.getElementById('main-inner').innerHTML = `
      <div class="empty-state">
        <h2>Master Dataset Missing</h2>
        <p style="margin-top:8px;">Run <code>python3 build_master_constitution.py</code> to generate <code>constitution_of_pakistan.json</code>.</p>
      </div>`;
    return;
  }

  buildSidebar();
  renderDashboard();
}

function switchSidebarTab(tabName) {
  CURRENT_TAB = tabName;
  ['entities', 'typologies', 'themes', 'articles'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', tabName === t);
  });
  buildSidebar(document.getElementById('global-search').value);
}

function findArticle(artNum) {
  return MASTER_DATA.articles.find(a => String(a.article_number) === String(artNum));
}

function findClauseRecursive(clausesList, targetId) {
  if (!clausesList || !Array.isArray(clausesList)) return null;
  for (const c of clausesList) {
    if (String(c.id) === String(targetId)) return c;
    if (c.children && c.children.length) {
      const found = findClauseRecursive(c.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function getClausesByTag(tagType, tagKey) {
  let results = [];
  function scan(clauses, artNum) {
    clauses.forEach(c => {
      const tags = tagType === 'typology' ? c.clause_typology : c.clause_theme;
      if (tags && tags.includes(tagKey)) {
        results.push({ article: artNum, clause_id: c.id });
      }
      if (c.children && c.children.length) scan(c.children, artNum);
    });
  }
  MASTER_DATA.articles.forEach(art => scan(art.clauses || [], art.article_number));
  return results;
}

function highlightSidebarItem(id) {
  document.querySelectorAll('.ent-item, .pinned-item').forEach(el => el.classList.remove('active'));
  if(id) {
    const el = document.querySelector(`.ent-item[data-id="${id}"], .pinned-item[id="${id}"]`);
    if(el) el.classList.add('active');
  }
}

function createSectionHeader(container, title) {
  const header = document.createElement('div');
  header.className = 'sidebar-section-title';
  header.textContent = title;
  container.appendChild(header);
}

/* Sidebar DOM Builder */
function buildSidebar(filterText = '') {
  const container = document.getElementById('sidebar-content');
  container.innerHTML = '';
  const q = filterText.trim().toLowerCase();

  const preambleItem = document.createElement('div');
  preambleItem.className = 'pinned-item';
  preambleItem.id = 'nav-preamble';
  preambleItem.innerHTML = `<span>📜 Preamble & Objectives</span>`;
  preambleItem.onclick = () => renderPreambleView();
  if(!q) container.appendChild(preambleItem);

  if (CURRENT_TAB === 'entities') {
    const entities = MASTER_DATA.entities || [];
    const topEntities = entities.filter(e => e.parent_id === null);
    
    function renderGroup(title, list) {
      const filtered = list.filter(ent => !q || ent.name.toLowerCase().includes(q) || ent.overview.toLowerCase().includes(q));
      if (!filtered.length && q) return;
      
      createSectionHeader(container, title);
      
      list.forEach(ent => {
        if (q && !ent.name.toLowerCase().includes(q) && !ent.overview.toLowerCase().includes(q)) return;
        const el = document.createElement('div');
        el.className = `ent-item type-${ent.type}`;
        el.dataset.id = ent.id;
        el.innerHTML = `<span>${ent.name}</span><span class="ent-count">${ent.clause_links ? ent.clause_links.length : ''}</span>`;
        el.onclick = () => renderEntityView(ent.id);
        container.appendChild(el);
        
        entities.filter(c => c.parent_id === ent.id).forEach(child => {
          if (q && !child.name.toLowerCase().includes(q) && !child.overview.toLowerCase().includes(q)) return;
          const childEl = document.createElement('div');
          childEl.className = `ent-item child type-${child.type}`;
          childEl.dataset.id = child.id;
          childEl.innerHTML = `<span>${child.name}</span><span class="ent-count">${child.clause_links ? child.clause_links.length : ''}</span>`;
          childEl.onclick = (ev) => { ev.stopPropagation(); renderEntityView(child.id); };
          container.appendChild(childEl);
        });
      });
    }
    renderGroup('Institutions & Offices', topEntities.filter(e => e.type === 'institution'));
    renderGroup('Protected Classes & Rights', topEntities.filter(e => e.type === 'protected_class'));

  } else if (CURRENT_TAB === 'typologies' || CURRENT_TAB === 'themes') {
    const enumMap = CURRENT_TAB === 'typologies' ? ENUM_TYPOLOGY : ENUM_THEME;
    const tagType = CURRENT_TAB === 'typologies' ? 'typology' : 'theme';
    
    Object.entries(enumMap).forEach(([key, label]) => {
      if (q && !label.toLowerCase().includes(q)) return;
      const count = getClausesByTag(tagType, key).length;
      const el = document.createElement('div');
      el.className = `ent-item`; 
      el.dataset.id = key;
      el.innerHTML = `<span>${label}</span><span class="ent-count">${count}</span>`;
      el.onclick = () => renderTagView(tagType, key, label);
      container.appendChild(el);
    });

  } else if (CURRENT_TAB === 'articles') {
    let currentChapter = '';
    MASTER_DATA.articles.forEach(art => {
      if (q && !art.article_number.toLowerCase().includes(q) && !(art.original_title || '').toLowerCase().includes(q)) return;
      
      const chapter = art.chapter_path ? art.chapter_path.split('>')[0].trim() : 'General';
      if (chapter !== currentChapter && !q) {
        currentChapter = chapter;
        createSectionHeader(container, currentChapter);
      }
      
      const purpose = art.article_summary && art.article_summary.core_purpose ? art.article_summary.core_purpose : '';
      const row = document.createElement('div');
      row.className = 'ent-item art-row';
      row.dataset.id = `art_${art.article_number}`;
      row.innerHTML = `
        <span class="art-num-pill">Art. ${art.article_number}</span>
        <span style="flex:1; margin-left:8px; min-width:0;">
          <span class="art-row-title">${art.original_title || ''}</span>
          ${purpose ? `<span class="art-row-purpose">${purpose}</span>` : ''}
        </span>`;
      row.onclick = () => renderArticleView(art.article_number);
      container.appendChild(row);
    });
  }

  if(CURRENT_ACTIVE_ID) highlightSidebarItem(CURRENT_ACTIVE_ID);
}

function handleBackNavigation() {
  if (!PREVIOUS_VIEW) { renderDashboard(); return; }
  if (PREVIOUS_VIEW.type === 'entity') renderEntityView(PREVIOUS_VIEW.id);
  else if (PREVIOUS_VIEW.type === 'tag') renderTagView(PREVIOUS_VIEW.tagType, PREVIOUS_VIEW.id, PREVIOUS_VIEW.label);
  else if (PREVIOUS_VIEW.type === 'preamble') renderPreambleView();
  else renderDashboard();
}

function renderDashboard() {
  PREVIOUS_VIEW = null;
  CURRENT_ACTIVE_ID = null;
  highlightSidebarItem(null);

  const totalArts = MASTER_DATA.articles ? MASTER_DATA.articles.length : 0;
  const main = document.getElementById('main-inner');
  main.innerHTML = `
    <div class="breadcrumb"><span>Overview & Foundations</span></div>
    <h1 class="page-title">The Constitution of the Islamic Republic of Pakistan</h1>
    <p class="entity-overview">
      Enacted on 12th April 1973 and authenticated as the supreme law of Pakistan. 
      This unified portal provides an interactive, clause-level breakdown of state power, individual fundamental rights, and institutional checks and balances.
    </p>

    <div class="stat-row">
      <div class="stat-box"><div class="num">${totalArts}</div><div class="lbl">Total Articles</div></div>
      <div class="stat-box"><div class="num">12</div><div class="lbl">Parts / Chapters</div></div>
      <div class="stat-box"><div class="num">${MASTER_DATA.entities ? MASTER_DATA.entities.length : 0}</div><div class="lbl">Mapped Actors</div></div>
    </div>

    <div class="category-header">Quick Access & Key Constitutional Pillars</div>
    <div class="dashboard-grid">
      <div class="dash-card" onclick="renderPreambleView()">
        <h3>📜 The Preamble</h3>
        <p>The 1949 Objectives Resolution declaring divine sovereignty, democratic values, and judicial independence.</p>
        <span class="tag" style="color:var(--text-faint);">Foundation ↗</span>
      </div>
      <div class="dash-card" onclick="switchSidebarTab('entities'); renderEntityView('citizen')">
        <h3>🛡️ Fundamental Rights</h3>
        <p>Articles 8–28 guaranteeing equality, freedom of speech, assembly, fair trial, and property protections.</p>
        <span class="tag" style="color:var(--text-faint);">Part II ↗</span>
      </div>
      <div class="dash-card" onclick="switchSidebarTab('entities'); renderEntityView('parliament')">
        <h3>🏛️ Majlis-e-Shoora (Parliament)</h3>
        <p>The bicameral federal legislature: National Assembly, Senate, legislative powers, and Money Bills.</p>
        <span class="tag" style="color:var(--text-faint);">Part III ↗</span>
      </div>
      <div class="dash-card" onclick="switchSidebarTab('entities'); renderEntityView('judiciary')">
        <h3>⚖️ The Superior Judicature</h3>
        <p>Federal Constitutional Court, Supreme Court, High Courts, SJC, and constitutional writ jurisdiction.</p>
        <span class="tag" style="color:var(--text-faint);">Part VII ↗</span>
      </div>
    </div>
  `;
}

/* Enhanced Preamble View with Paragraph Formatting */
function renderPreambleView() {
  PREVIOUS_VIEW = { type: 'dashboard' };
  CURRENT_ACTIVE_ID = 'nav-preamble';
  highlightSidebarItem('nav-preamble');

  const preamble = MASTER_DATA.preamble || {};
  const segments = preamble.segments || [];

  const main = document.getElementById('main-inner');
  let html = `
    <div class="breadcrumb"><a class="back-btn" onclick="handleBackNavigation()">← Dashboard</a></div>
    <div class="article-meta-header">
      <span class="art-badge">Foundational Document</span>
      <span class="art-status">Operative via Article 2A</span>
    </div>
    <h1 class="page-title">Preamble & The Objectives Resolution</h1>
    <div class="art-chapter">Enacted 12th April 1973 — Incorporated substantively via Article 2A</div>

    <div class="summary-card">
      <div class="layman">Declares that sovereignty over the entire Universe belongs to Almighty Allah alone, that authority is a sacred trust exercised by chosen representatives, and that Pakistan is dedicated to freedom, equality, tolerance, and social justice.</div>
      <div class="summary-subheading">Historical Background</div>
      <div class="summary-content">Passed on March 12, 1949 by Pakistan's first Constituent Assembly under Prime Minister Liaquat Ali Khan, the Objectives Resolution served as the preamble to all three Constitutions (1956, 1962, and 1973) and was made an enforceable substantive provision via Article 2A in 1985.</div>
    </div>

    <div class="category-header">Verbatim Constitutional Recitals</div>
    <div class="preamble-box">
  `;

  if (segments.length) {
    segments.forEach(seg => {
      const segId = String(seg.id || '').toLowerCase();
      if (segId === 'p0') {
        // Clean Dedication/Title Banner
        html += `<div class="preamble-invocation">${seg.text.replace(/\n/g, '<br>')}</div>`;
      } else {
        html += `
          <div class="preamble-segment-card">
            <div class="preamble-para-text">${seg.text}</div>
          </div>
        `;
      }
    });
  } else {
    html += `<div class="preamble-para-text">${preamble.full_text_verbatim || 'Preamble text.'}</div>`;
  }
  html += `</div>`;
  main.innerHTML = html;
  document.getElementById('main').scrollTop = 0;
}

function renderTagView(tagType, tagKey, tagLabel) {
  PREVIOUS_VIEW = { type: 'dashboard' };
  CURRENT_ACTIVE_ID = tagKey;
  highlightSidebarItem(tagKey);
  
  const main = document.getElementById('main-inner');
  const links = getClausesByTag(tagType, tagKey);

  const overviewMap = tagType === 'typology' ? ENUM_TYPOLOGY_OVERVIEW : ENUM_THEME_OVERVIEW;
  const overviewText = overviewMap[tagKey] || `The following clauses are classified under this ${tagType === 'typology' ? 'legal concept' : 'thematic domain'}.`;

  let html = `
    <div class="breadcrumb"><a class="back-btn" onclick="handleBackNavigation()">← Dashboard</a><span class="sep">/</span><span>${tagType === 'typology' ? 'Legal Concept' : 'Subject Domain'}</span></div>
    <h1 class="page-title">${tagLabel}</h1>
    <p class="entity-overview">${overviewText}</p>
  `;

  if (!links.length) {
    html += `<div class="empty-state"><p>No provisions map to this category yet.</p></div>`;
  } else {
    // Resolve each link to its article + clause, then group by theme (or by chapter Part
    // when we're already inside a theme view) so the reader sees labeled buckets instead
    // of one long undifferentiated list.
    const resolved = [];
    links.forEach(link => {
      const art = findArticle(link.article);
      const clause = art ? findClauseRecursive(art.clauses, link.clause_id) : null;
      if (!art || !clause) return;
      resolved.push({ art, clause, link });
    });

    // Domain (theme) pages group by typology — what kind of provision it is (a power, a
    // duty, a right, a limit...). Grouping by chapter here would be circular, since a Part
    // of the constitution is already close to a theme. Typology pages group by theme instead,
    // to show which subject areas rely on that kind of provision most.
    const groupByTypology = tagType === 'theme';
    const groups = {};
    const groupOrder = [];

    resolved.forEach(({ art, clause }) => {
      let groupKey, groupLabel;
      if (groupByTypology) {
        const typKey = (clause.clause_typology && clause.clause_typology[0]) || 'procedural';
        groupLabel = ENUM_TYPOLOGY[typKey] || 'Other';
        groupKey = typKey;
      } else {
        // Grouping a typology view by theme surfaces which subject areas rely on this
        // kind of provision most.
        const themeKey = (clause.clause_theme && clause.clause_theme[0]) || 'meta_law_interpretation';
        groupLabel = ENUM_THEME[themeKey] || 'Other';
        groupKey = themeKey;
      }
      if (!groups[groupKey]) { groups[groupKey] = { label: groupLabel, items: [] }; groupOrder.push(groupKey); }
      groups[groupKey].items.push({ art, clause });
    });

    // Sort into a fixed reading order (rather than "whichever appeared first"), so a
    // domain page always reads Powers -> Duties -> Rights -> Limits -> Procedure -> ...
    const TYPOLOGY_ORDER = ['substantive_power', 'duty_obligation', 'fundamental_right', 'checks_or_limits', 'ouster_immunity', 'procedural', 'creation_or_definition', 'declaratory_policy', 'definitional_interpretative', 'transitional_validation'];
    const THEME_ORDER = Object.keys(ENUM_THEME);
    const fixedOrder = groupByTypology ? TYPOLOGY_ORDER : THEME_ORDER;
    groupOrder.sort((a, b) => fixedOrder.indexOf(a) - fixedOrder.indexOf(b));

    groupOrder.forEach(gKey => {
      const group = groups[gKey];
      html += `<div class="category-group"><div class="category-header">${group.label} <span style="font-weight:400; text-transform:none; letter-spacing:0;">(${group.items.length})</span></div>`;
      group.items.forEach(({ art, clause }) => {
        const refStr = `Art. ${art.article_number}${clause.id !== '0' ? `(${clause.id})` : ''}`;
        const bulletLine = clause.index_bullet || (clause.text.slice(0, 95) + '…');
        html += `
          <div class="provision-bullet" onclick="setPreviousView('tag', '${tagType}', '${tagKey}', '${tagLabel}'); renderArticleView('${art.article_number}', '${clause.id}')">
            <span class="provision-ref">${refStr}</span>
            <span class="provision-text">${bulletLine}</span>
          </div>`;
      });
      html += `</div>`;
    });
  }

  main.innerHTML = html;
  document.getElementById('main').scrollTop = 0;
}

function renderEntityView(entityId) {
  const entity = (MASTER_DATA.entities || []).find(e => e.id === entityId);
  if (!entity) return;
  
  PREVIOUS_VIEW = { type: 'dashboard' };
  CURRENT_ACTIVE_ID = entityId;
  highlightSidebarItem(entityId);

  const parent = entity.parent_id ? (MASTER_DATA.entities || []).find(e => e.id === entity.parent_id) : null;
  const main = document.getElementById('main-inner');

  let typeLabel = entity.type === 'protected_class' ? 'Protected Class' : (entity.type === 'individual_role' ? 'Individual Role' : 'Institution');
  let html = `<div class="breadcrumb"><a class="back-btn" onclick="handleBackNavigation()">← Dashboard</a>`;
  if (parent) html += `<span class="sep">/</span><a class="crumb-link" onclick="renderEntityView('${parent.id}')">${parent.name}</a>`;
  html += `<span class="sep">/</span><span>${typeLabel}</span></div>`;
  html += `<h1 class="page-title">${entity.name}</h1><p class="entity-overview">${entity.overview}</p>`;

  const groupedLinks = {};
  (entity.clause_links || []).forEach(link => {
    const cat = link.category || 'uncategorized';
    if (!groupedLinks[cat]) groupedLinks[cat] = [];
    groupedLinks[cat].push(link);
  });

  CATEGORY_MAP.forEach(cat => {
    const links = groupedLinks[cat.key];
    if (!links || !links.length) return;
    html += `<div class="category-group"><div class="category-header">${cat.label}</div>`;
    links.forEach(link => {
      const art = findArticle(link.article);
      const clause = art ? findClauseRecursive(art.clauses, link.clause_id) : null;
      if (!art || !clause) return;
      const refStr = `Art. ${link.article}${clause.id !== '0' ? `(${clause.id})` : ''}`;
      const bulletLine = clause.index_bullet || (clause.text.slice(0, 95) + '…');
      const roleNotice = link.role === 'secondary' ? '<span class="role-tag">[secondary]</span>' : '';
      html += `
        <div class="provision-bullet" onclick="setPreviousView('entity', null, '${entityId}', null); renderArticleView('${link.article}', '${link.clause_id}')">
          <span class="provision-ref">${refStr}</span><span class="provision-text">${bulletLine}${roleNotice}</span>
        </div>`;
    });
    html += `</div>`;
  });

  main.innerHTML = html;
  document.getElementById('main').scrollTop = 0;
}

function setPreviousView(type, tagType, id, label) {
  PREVIOUS_VIEW = { type, tagType, id, label };
}

function renderArticleView(artNum, activeClauseId = null) {
  const art = findArticle(artNum);
  if (!art) return;

  CURRENT_ACTIVE_ID = `art_${artNum}`;
  highlightSidebarItem(`art_${artNum}`);
  
  const main = document.getElementById('main-inner');

  let backLabel = 'Dashboard';
  if (PREVIOUS_VIEW) {
    if (PREVIOUS_VIEW.type === 'entity') backLabel = (MASTER_DATA.entities || []).find(e => e.id === PREVIOUS_VIEW.id)?.name || 'Entity';
    else if (PREVIOUS_VIEW.type === 'tag') backLabel = PREVIOUS_VIEW.label;
  }

  let html = `
    <div class="breadcrumb"><a class="back-btn" onclick="handleBackNavigation()">← Return to ${backLabel}</a></div>
    <div class="article-meta-header">
      <span class="art-badge">Article ${art.article_number}</span><span class="art-status">${art.status}</span>
    </div>
    <h1 class="page-title" style="font-size:26px; margin-bottom:6px;">${art.original_title || ''}</h1>
    <div class="art-chapter">${art.chapter_path || ''}</div>`;

  const searchParam = art.search_term || `Article ${art.article_number} Constitution of Pakistan 1973 legal analysis`;
  html += `<a class="search-external-link" target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(searchParam)}">Search case law and commentary ↗</a>`;

  if (art.article_summary) {
    html += `
      <div class="summary-card">
        <div class="layman">${art.article_summary.layman_summary}</div>
        ${art.article_summary.historical_context ? `<div class="summary-subheading">Historical Context</div><div class="summary-content">${art.article_summary.historical_context}</div>` : ''}
        ${art.article_level_amendments_summary && art.article_level_amendments_summary.length ? `
          <div class="summary-subheading" style="margin-top:12px;">Constitutional Amendments</div>
          ${art.article_level_amendments_summary.map(am => `
            <div class="amend-badge-card"><strong>${am.act}</strong>: ${am.change}</div>
          `).join('')}` : ''}
      </div>`;
  }

  function renderClauseTree(clauseNode) {
    const isTarget = String(clauseNode.id) === String(activeClauseId);
    const nodeClass = isTarget ? 'clause-tree-node targeted' : (activeClauseId ? 'clause-tree-node dimmed' : 'clause-tree-node');

    let cHtml = `<div class="${nodeClass}" data-id="${clauseNode.id}">`;
    cHtml += `<span class="clause-marker">(${clauseNode.id})</span><span class="clause-body">${clauseNode.text}</span>`;
    if (clauseNode.proviso) cHtml += `<div class="clause-proviso">${clauseNode.proviso}</div>`;
    if (clauseNode.children && clauseNode.children.length) {
      cHtml += `<div class="sub-children-container">`;
      clauseNode.children.forEach(ch => { cHtml += `<div class="sub-child-node"><span class="clause-marker">(${ch.id})</span>${ch.text}</div>`; });
      cHtml += `</div>`;
    }

    if (isTarget || (!activeClauseId && clauseNode.id === '0')) {
      cHtml += `<div class="clause-inspector-box">`;
      if (clauseNode.layman_summary) cHtml += `<div class="inspector-header">Plain-English Meaning</div><div class="inspector-text">${clauseNode.layman_summary}</div>`;
      if (clauseNode.debates_and_arguments) cHtml += `<div class="inspector-header">Interpretation</div><div class="inspector-text">${clauseNode.debates_and_arguments}</div>`;

      cHtml += `<div class="power-map-card"><div class="power-map-title">Power & Typology Mapping</div>`;
      cHtml += `<div class="type-tags-row">`;
      if(clauseNode.clause_typology) clauseNode.clause_typology.forEach(t => cHtml += `<span class="type-tag typology">${ENUM_TYPOLOGY[t] || t}</span>`);
      if(clauseNode.clause_theme) clauseNode.clause_theme.forEach(t => cHtml += `<span class="type-tag theme">${ENUM_THEME[t] || t}</span>`);
      cHtml += `</div>`;
      if (clauseNode.power_breakdown && clauseNode.power_breakdown.who_holds_power && clauseNode.power_breakdown.who_holds_power !== "N/A") {
         cHtml += `<div class="power-grid" style="margin-top:10px;"><div class="power-item"><span>Who Holds Power</span><strong>${clauseNode.power_breakdown.who_holds_power}</strong></div><div class="power-item"><span>Who Is Affected</span><strong>${clauseNode.power_breakdown.who_is_affected}</strong></div></div>`;
         cHtml += `<div class="power-limit"><span>Check/Limit</span>${clauseNode.power_breakdown.the_check_or_limit}</div>`;
      }
      cHtml += `</div>`;

      if (clauseNode.amendment_insights && clauseNode.amendment_insights.length) {
        clauseNode.amendment_insights.forEach(ai => {
          cHtml += `<div class="amend-badge-card"><strong>${ai.act}</strong>: ${ai.insight}</div>`;
        });
      }
      cHtml += `</div>`;
    }
    cHtml += `</div>`;
    return cHtml;
  }

  (art.clauses || []).forEach(cl => { html += renderClauseTree(cl); });
  main.innerHTML = html;
  document.getElementById('main').scrollTop = 0;
  if (activeClauseId) {
    setTimeout(() => { document.querySelector(`.clause-tree-node.targeted`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 40);
  }
}

document.getElementById('global-search').addEventListener('input', (e) => { buildSidebar(e.target.value); });
window.addEventListener('DOMContentLoaded', initializeApp);