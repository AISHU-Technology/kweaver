/* eslint-disable max-lines */
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { kwCookie } from '@/utils/handleFunction';

export default (props: any) => {
  const { serviceId, origin, appid } = props;

  return `
<h2 id="引用">${intl.get('cognitiveService.iframeDocument.reference')}</h2>
<pre style="position: relative;"><code class="language-javascript">import ADGraph from &#39;./ADGraph.js&#39;;
</code></pre>
<pre style="position: relative;"><code class="language-javascript" style="position: relative;">const graph = new ADGraph({
    container: container.current,
    location: { 
      origin: &#39;${origin}&#39;, 
      pathname: &#39;/iframe/graph&#39;,
      search: '?appid=${appid || '{your appid}'}&service_id=${serviceId}' 
    },
});

// ${intl.get('cognitiveService.iframeDocument.updateNodeData')}
graph.updateItem(&#39;node&#39;, {
    label: &#39;test&#39;,
});
</code></pre>

<h1 id="事件绑定解绑" class="moduleName">${intl.get('cognitiveService.iframeDocument.eventBindOrUnbind')}</h1>
<h2 id="graphoneventname-handler" style="margin-top: 16px;">graph.on(eventName, handler)</h2>
<p>${intl.get('cognitiveService.iframeDocument.bindEventListeners')}</p>
<h3 id="参数">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>eventName</td>
      <td>string</td>
      <td>true</td>
      <td>${
        kwCookie.get('kwLang') === 'zh-CN'
          ? `${intl.get('cognitiveService.iframeDocument.eventNameSeeOptional')} <a href='#基础事件'>Event</a>`
          : `${intl.get(
              'cognitiveService.iframeDocument.eventNameSeeOptional'
            )} <a href='#基础事件'>Event</a> ${intl.get('cognitiveService.iframeDocument.eventNameSeeOptional2')}`
      }</td>
    </tr>
    <tr>
      <td>handler</td>
      <td>Function</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.listenForFunctions')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">// ${intl.get(
    'cognitiveService.iframeDocument.clickListenNodeBindings'
  )} 
graph.on(&#39;node:click&#39;, (evt) =&gt; {
  const item = evt.item; // ${intl.get('cognitiveService.iframeDocument.objectItemToBeOperatedOn')}
  const target = evt.target; // ${intl.get('cognitiveService.iframeDocument.specificObjectBeingOperatedOn')}
  // ...
});
</code></pre>
<h2 id="graphoffeventname-handler">graph.off(eventName, handler)</h2>
<p>${intl.get('cognitiveService.iframeDocument.unbindEventListeners')}</p>
<h3 id="参数-1">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>eventName</td>
      <td>string</td>
      <td>true</td>
      <td>${
        kwCookie.get('kwLang') === 'zh-CN'
          ? `${intl.get('cognitiveService.iframeDocument.eventNameSeeOptional')} <a href='#基础事件'>Event</a>`
          : `${intl.get(
              'cognitiveService.iframeDocument.eventNameSeeOptional'
            )} <a href='#基础事件'>Event</a> ${intl.get('cognitiveService.iframeDocument.eventNameSeeOptional2')}`
      }</td>
    </tr>
    <tr>
      <td>handler</td>
      <td>Function</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.listenForFunctions')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-1">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">// ${intl.get(
    'cognitiveService.iframeDocument.listeningFunction'
  )}
const fn = (evt) =&gt; {
  const item = evt.item; // ${intl.get('cognitiveService.iframeDocument.objectItemToBeOperatedOn')}
  const target = evt.target; // ${intl.get('cognitiveService.iframeDocument.specificObjectBeingOperatedOn')}
  // ...
};
// ${intl.get('cognitiveService.iframeDocument.clickListenNodeBindings')}
graph.on(&#39;node:click&#39;, fn);

// ${intl.get('cognitiveService.iframeDocument.removeClickListeningEvent')}
graph.off(&#39;node:click&#39;, fn);
</code></pre>
<h1 id="获取" class="moduleName">${intl.get('cognitiveService.iframeDocument.getting')}</h1>
<h2 id="graphgetnodes" style="margin-top: 16px;">graph.getNodes()</h2>
<p>${intl.get('cognitiveService.iframeDocument.getDataAllNodes')}</p>
<h3 id="返回值">${intl.get('cognitiveService.iframeDocument.returnValue')}</h3>
<p>${intl.get('cognitiveService.iframeDocument.returnValueType')} Array；</p>
<h3 id="用法-2">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">const nodes = graph.getNodes();
</code></pre>
<h2 id="graphgetedges">graph.getEdges()</h2>
<p>${intl.get('cognitiveService.iframeDocument.getDataAllEdges')}</p>
<h3 id="返回值-1">${intl.get('cognitiveService.iframeDocument.returnValue')}</h3>
<p>${intl.get('cognitiveService.iframeDocument.returnValueType')} Array；</p>
<h3 id="用法-3">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">const edges = graph.getEdges();
</code></pre>
<h2 id="graphfindbyidid">graph.findById(id)</h2>
<p>${intl.get('cognitiveService.iframeDocument.queryCorrespondingBasedID')}</p>
<h3 id="参数-2">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>id</td>
      <td>string</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.elementId')}</td>
    </tr>
  </tbody>
</table>
<h3 id="返回值-2">${intl.get('cognitiveService.iframeDocument.returnValue')}</h3>
<p>${intl.get('cognitiveService.iframeDocument.returnValueType')} Object；<br />${intl.get(
    'cognitiveService.iframeDocument.ifElementThenReturnedOtherwiseUndefined'
  )}</p>
<h3 id="用法-4">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">const node = graph.findById(&#39;node&#39;);
</code></pre>
<h2 id="graphgetneighborsnode-type">graph.getNeighbors(node, type)</h2>
<p>${intl.get('cognitiveService.iframeDocument.queryNodeDataBasedId')}</p>
<h3 id="参数-3">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>node</td>
      <td>string</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.nodeId')}</td>
    </tr>
    <tr>
      <td>type</td>
      <td>&#39;source&#39; / &#39;target&#39; / undefined</td>
      <td>false</td>
      <td>
        ${intl.get('cognitiveService.iframeDocument.neighborTypeAllTypesNeighborsAreReturned')}
      </td>
    </tr>
  </tbody>
</table>
<h3 id="返回值-3">${intl.get('cognitiveService.iframeDocument.returnValue')}</h3>
<p>${intl.get('cognitiveService.iframeDocument.returnValueType')} Array；<br />${intl.get(
    'cognitiveService.iframeDocument.nodeArrayMatchTheRequirements'
  )}</p>
<h3 id="用法-5">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">const neighbors = graph.getNeighbors(&#39;node1&#39;, &#39;source&#39;);
</code></pre>
<h1 id="元素操作" class="moduleName">${intl.get('cognitiveService.iframeDocument.elementActions')}</h1>
<h2 id="graphadditemtype-model" style="margin-top: 16px;">graph.addItem(type, model)</h2>
<p>${intl.get('cognitiveService.iframeDocument.addNewElements')}</p>
<h3 id="参数-4">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>type</td>
      <td>string</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.elementTypeOptionalValues')}</td>
    </tr>
    <tr>
      <td>model</td>
      <td>Object</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.theDataModelOfTheElement')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-6">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">const model = {
  id: &#39;node&#39;,
  label: &#39;node&#39;,
  address: &#39;cq&#39;,
  x: 200,
  y: 150,
  style: {
    fill: &#39;blue&#39;,
  },
};

graph.addItem(&#39;node&#39;, model);
</code></pre>
<h2 id="graphremoveitemnode">graph.removeItem(node)</h2>
<p>${intl.get('cognitiveService.iframeDocument.deleteElements')}</p>
<h3 id="参数-5">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>node</td>
      <td>string</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.elementId')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-7">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">// ${intl.get(
    'cognitiveService.iframeDocument.queryNodeById'
  )}
graph.removeItem(&#39;node&#39;);
</code></pre>
<h2 id="graphupdateitemnode-model-stack">graph.updateItem(node, model)</h2>
<p>${intl.get('cognitiveService.iframeDocument.updateElementsIncludingUpdatingData')}</p>
<h3 id="参数-6">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>node</td>
      <td>string</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.elementId')}</td>
    </tr>
    <tr>
      <td>model</td>
      <td>Object</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.theDataModelToBeUpdated')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-8">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">const model = {
  id: &#39;node&#39;,
  label: &#39;node&#39;,
  address: &#39;cq&#39;,
  x: 200,
  y: 150,
  style: {
    fill: &#39;blue&#39;,
  },
};

graph.updateItem(&#39;node&#39;, model);
</code></pre>
<h1 id="视口操作" class="moduleName">${intl.get('cognitiveService.iframeDocument.viewportActions')}</h1>
<h2 id="graphzoomtotoratio-center" style="margin-top: 16px;">graph.zoomTo(toRatio, center)</h2>
<p>${intl.get('cognitiveService.iframeDocument.scaleTheViewportWindowToRatio')}</p>
<h3 id="参数-7">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>toRatio</td>
      <td>Number</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.fixedRatioValue')}</td>
    </tr>
    <tr>
      <td>center</td>
      <td>Object</td>
      <td>false</td>
      <td>${intl.get('cognitiveService.iframeDocument.scalingIsCenteredOnTheXAndY')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-9">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">// ${intl.get(
    'cognitiveService.iframeDocument.centerPointZoom3Times'
  )}
graph.zoomTo(3, { x: 100, y: 100 });

// ${intl.get('cognitiveService.iframeDocument.zoomOutTo05')}
graph.zoomTo(0.5);
</code></pre>
<h2 id="graphfitviewpadding-rules">graph.fitView(padding, rules)</h2>
<p>${intl.get('cognitiveService.iframeDocument.makeTheCanvasContentsFitTheViewport')}</p>
<h3 id="参数-8">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>padding</td>
      <td>Number / Array</td>
      <td>false</td>
      <td>${intl.get('cognitiveService.iframeDocument.spacingValuesInFourDirections')}</td>
    </tr>
    <tr>
      <td>rules</td>
      <td>
        { onlyOutOfViewPort?: boolean; direction?: &#39;x&#39; / &#39;y&#39; / &#39;both&#39;; ratioRule?: &#39;max&#39;
        / &#39;min}
      </td>
      <td>false</td>
      <td>${intl.get('cognitiveService.iframeDocument.rulesOfFitView')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-10">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">// ${intl.get(
    'cognitiveService.iframeDocument.paddingIsUsed'
  )}
graph.fitView(20);

// ${intl.get('cognitiveService.iframeDocument.beEquivalentTo1')}
graph.fitView([20]);

// ${intl.get('cognitiveService.iframeDocument.paddingSetToAnArray')}
graph.fitView([20, 10]);

// ${intl.get('cognitiveService.iframeDocument.paddingSetsThePseudoArray')}
graph.fitView([20, 10, 20, 15]);

// ${intl.get('cognitiveService.iframeDocument.usingFitViewByRulesCustomizeRules')}
graph.fitView(0, { onlyOutOfViewPort: true, direction: &#39;y&#39; });
</code></pre>
<h2 id="graphfocusitemnode-animate-animatecfg">graph.focusItem(node, animate, animateCfg)</h2>
<p>${intl.get('cognitiveService.iframeDocument.moveTheGraph')}</p>
<h3 id="参数-9">${intl.get('cognitiveService.iframeDocument.parameter')}</h3>
<table valign="middle">
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.name')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.type')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.requiredOrNot')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>node</td>
      <td>string</td>
      <td>true</td>
      <td>${intl.get('cognitiveService.iframeDocument.elementId')}</td>
    </tr>
    <tr>
      <td>animate</td>
      <td>boolean</td>
      <td>false</td>
      <td>${intl.get('cognitiveService.iframeDocument.ifNotConfigured')}</td>
    </tr>
    <tr>
      <td>animateCfg</td>
      <td>Object</td>
      <td>false</td>
      <td>${intl.get('cognitiveService.iframeDocument.ifAnimatedYouCanConfigure')}</td>
    </tr>
  </tbody>
</table>
<h3 id="用法-11">${intl.get('cognitiveService.iframeDocument.usage')}</h3>
<pre style="position: relative;"><code class="language-javascript">graph.focusItem(&#39;node&#39;);

// ${intl.get('cognitiveService.iframeDocument.animationMove')}
graph.focusItem(&#39;node&#39;, true);

// ${intl.get('cognitiveService.iframeDocument.animateMoveConfigureTheAnimation')}
graph.focusItem(&#39;node&#39;, true, {
  easing: &#39;easeCubic&#39;,
  duration: 400,
});
</code></pre>

<h2 id="基础事件">${intl.get('cognitiveService.iframeDocument.basicEvents')}</h2>
<div class="event">
<table>
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.eventName')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>beforelayout</td>
      <td>
        ${intl.get('cognitiveService.iframeDocument.triggeredBeforeLayout')}      
      </td>
    </tr>
    <tr>
      <td>afterlayout</td>
      <td>
        ${intl.get('cognitiveService.iframeDocument.triggeredAfterLayout')}  
      </td>
    </tr>
    <tr>
      <td>contextmenu</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredAndOpenedContextMenu')}</td>
    </tr>
    <tr>
      <td>wheelzoom</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenTheMouseWheelIsScrolled')} </td>
    </tr>
  </tbody>
</table>
<h3 id="canvas">canvas</h3>
<table>
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.eventName')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>canvas:click</td>
      <td>${intl.get('cognitiveService.iframeDocument.theEventTriggeredMouseWheelScrolled')}</td>
    </tr>
    <tr>
      <td>canvas:dragstart</td>
      <td>${intl.get('cognitiveService.iframeDocument.theEventTriggeredWhenCanvasStartsDragged')}</td>
    </tr>
  </tbody>
</table>
<h3 id="node">node</h3>
<table>
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.eventName')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>node:drag</td>
      <td>${intl.get('cognitiveService.iframeDocument.theEventTriggeredWhenNodeBeingDragged')}</td>
    </tr>
    <tr>
      <td>node:dragstart</td>
      <td>${intl.get('cognitiveService.iframeDocument.theEventTriggeredWhenNodeStartsDragged')}</td>
    </tr>
    <tr>
      <td>node:dragend</td>
      <td>${intl.get('cognitiveService.iframeDocument.theEventTriggeredWhenDraggingCompleted')}</td>
    </tr>
    <tr>
      <td>node:dblclick</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenLeftClicksNode')}</td>
    </tr>
    <tr>
      <td>node:click</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenLeftClicksTheNode')}</td>
    </tr>
    <tr>
      <td>node:mousemove</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenMouseMovesInsideNode')}</td>
    </tr>
    <tr>
      <td>node:mouseout</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenMouseMovesOutsideNode')}</td>
    </tr>
  </tbody>
</table>
<h3 id="edge">edge</h3>
<table>
  <thead>
    <tr>
      <th>${intl.get('cognitiveService.iframeDocument.eventName')}</th>
      <th>${intl.get('cognitiveService.iframeDocument.description')}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>edge:click</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenLeftClicksEdge')}</td>
    </tr>
    <tr>
      <td>edge:mousemove</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenMouseMovesOnTheEdge')}</td>
    </tr>
    <tr>
      <td>edge:mouseout</td>
      <td>${intl.get('cognitiveService.iframeDocument.triggeredWhenMouseMovesOutOfTheEdge')}</td>
    </tr>
  </tbody>
</table>
</div>

</div>
`;
};
