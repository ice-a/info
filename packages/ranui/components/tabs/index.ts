import {
  isDisabled,
  setElementClass,
  deleteElementChildClass,
} from "@/utils/index";


function CustomElement() {
  if (typeof window !== "undefined" && !customElements.get("r-tabs")) {
    class Tabs extends HTMLElement {
      static get observedAttributes() {
        return ["active", "forceRender", "type", "align"];
      }
      _container: HTMLDivElement;
      _header: HTMLDivElement;
      _nav: HTMLDivElement;
      _line: HTMLDivElement;
      _content: HTMLDivElement;
      _wrap: HTMLDivElement;
      _slot: HTMLSlotElement;
      tabHeaderKeyMapIndex: Record<string, number>;
      constructor() {
        super();
        /**
         * <div class="tab">
         *   <div class="tab-header">
         *      <div class="tab-header_nav">...</div>
         *      <div class="tab-header_line"></div>
         *   </div>
         *   <div class="tab-content">
         *      <div class="tab-content_wrap">
         *         <slot></slot>
         *      </div>
         *   </div>
         * </div>
         */
        this._container = document.createElement("div");
        this._container.setAttribute("class", "tab");
        this._header = document.createElement("div");
        this._header.setAttribute("class", "tab-header");
        this._nav = document.createElement("div");
        this._nav.setAttribute("class", "tab-header_nav");
        this._line = document.createElement("div");
        this._line.setAttribute("class", "tab-header_line");
        this._content = document.createElement("div");
        this._content.setAttribute("class", "tab-content");
        this._wrap = document.createElement("div");
        this._wrap.setAttribute("class", "tab-content_wrap");
        this._slot = document.createElement("slot");
        this._wrap.appendChild(this._slot);
        this._content.appendChild(this._wrap);
        this._header.appendChild(this._nav);
        this._header.appendChild(this._line);
        this._container.appendChild(this._header);
        this._container.appendChild(this._content);
    
        this.tabHeaderKeyMapIndex = {};
    
        const shadowRoot = this.attachShadow({ mode: "closed" });
        shadowRoot.appendChild(this._container);
      }
    
      get align() {
        return this.getAttribute("align") || "start";
      }
    
      set align(value) {
        this.setAttribute("align", value);
      }
    
      set type(value) {
        this.setAttribute("type", value);
      }
    
      get type() {
        return this.getAttribute("type") || "flat";
      }
    
      get active() {
        return this.getAttribute("active");
      }
    
      set active(value) {
        if (value) {
          this.setAttribute("active", value);
          this.setTabLine(value);
          this.setTabContent(value);
        } else {
          this.removeAttribute("active");
        }
      }
      /**
       * @description: ??????tabPane??????key??????index??????????????????????????????tabs??????tabPane key???????????????
       * @param {string} key
       * @param {number} index
       */
      initTabHeaderKeyMapIndex = (key: string, index: number) => {
        const value = this.tabHeaderKeyMapIndex[key];
        if (value) {
          throw new Error(
            "tab ????????? key ???????????????, ???????????? tab ???????????? key ??????"
          );
        } else {
          this.tabHeaderKeyMapIndex[key] = index;
        }
      };
      /**
       * @description: ???????????????tabPane??????tabs?????????
       * @param {Element} tabPane
       * @param {number} index
       * @return {Element}
       */
      createTabHeader(tabPane: Element, index: number) {
        const label = tabPane.getAttribute("label") || "";
        const key = tabPane.getAttribute("ranKey") || `${index}`;
        const type = tabPane.getAttribute("type") || "text";
        this.initTabHeaderKeyMapIndex(key, index);
        const tabHeader = document.createElement("r-button");
        tabHeader.setAttribute("class", "tab-header_nav__item");
        tabHeader.setAttribute("type", type);
        isDisabled(tabPane) && tabHeader.setAttribute("disabled", "");
        tabHeader.setAttribute("ran-key", key);
        tabHeader.innerHTML = label;
        return tabHeader;
      }
      /**
       * @description: ?????????tabLine????????????????????????tabs???align?????????center???????????????
       */
      initTabLineAlignCenter = () => {
        const { length } = this._nav.children;
        let left = 0;
        for (let i = 0; i < length; i++) {
          const { width = 0 } = this._nav.children[i].getBoundingClientRect();
          left += width;
        }
        this._line.style.setProperty("left", `calc(50% - ${left / 2}px)`);
      };
      /**
       * @description: ?????????tabLine????????????????????????tabs???align?????????end???????????????
       */
      initTabLineAlignEnd = () => {
        const { length } = this._nav.children;
        let left = 0;
        for (let i = 0; i < length; i++) {
          const { width = 0 } = this._nav.children[i].getBoundingClientRect();
          left += width;
        }
        this._line.style.setProperty("left", `calc(100% - ${left}px)`);
      };
      /**
       * @description: ??????key?????????tabLine?????????
       * @param {string} key
       */
      setTabLine = (key: string) => {
        if (key) {
          const index = this.tabHeaderKeyMapIndex[key];
          // ??????tabHeader???????????????tabLine??????
          const TabHeader = this._nav.children[index];
          const { width = 0 } = TabHeader.getBoundingClientRect();
          this._line.style.setProperty("width", `${width}px`);
          // ??????tabLine???????????????
          let distance = 0;
          for (let i = 0; i < index; i++) {
            const item = this._nav.children[i];
            const { width = 0 } = item.getBoundingClientRect();
            distance += width;
          }
          // ?????????????????????
          this._line.style.setProperty("transform", `translateX(${distance}px)`);
        }
      };
      /**
       * @description: ???????????????key?????????tabContent
       */
      setTabContent = (key: string) => {
        if (key) {
          const index = this.tabHeaderKeyMapIndex[key];
          this._wrap.style.setProperty("transform", `translateX(${index * -100}%)`);
        }
      };
      /**
       * @description: ??????????????????tabLine?????????
       * @param {Event} e
       * @param {number} index
       * @param {number} width
       */
      clickTabHead = (e: Event) => {
        const tabHeader = e.target as Element;
        // ??????????????????????????????
        // tabHeader.scrollIntoView({ block: "center", inline: "center" });
        // TODO: tab????????????????????????
        const key = tabHeader.getAttribute("ran-key");
        const disabled = isDisabled(tabHeader);
        if (!disabled && key) {
          this.setAttribute("active", key);
          this.setTabLine(key);
          this.setTabContent(key);
          deleteElementChildClass(this._nav, "active");
          setElementClass(tabHeader, "active");
        }
      };
      /**
       * @description: ?????????tabs???active?????????tabLine,tabContent
       */
      initActive = () => {
        const tabHeaderList = [...this._nav.children];
        const initTabList = tabHeaderList.filter((item) => !isDisabled(item));
        let initTabHeader: Element | undefined;
        // ?????????active?????????active????????????????????????????????????
        if (this.active !== null) {
          initTabHeader = initTabList.find((item,index)=>((item.getAttribute("ran-key") || `${index}`) === this.active));
        }
        // ????????????active??????????????????????????????????????????
        if(!initTabHeader){
          initTabHeader = initTabList.shift();
        }
        // ???????????????????????????
        if (!initTabHeader) return;
        const index = tabHeaderList.findIndex((item) => item === initTabHeader);
        const key = initTabHeader?.getAttribute("ran-key") || `${index}`;
        if (key !== null) {
            this.setAttribute("active", `${key}`);
            setElementClass(initTabHeader, "active");
            const { width = 0 } = initTabHeader.getBoundingClientRect();
            this._line.style.setProperty("width", `${width}px`);
            this.setTabLine(key);
            this.setTabContent(key);
        }
      };
      /**
       * @description: ??????slot???????????????/??????/?????????????????????tabs?????????
       * @return {*}
       */
      listenSlotChange = () => {
        const slots = this._slot.assignedElements();
        slots.forEach((item, index) => {
          const tabPane = this.createTabHeader(item, index);
          this._nav.appendChild(tabPane);
          tabPane.addEventListener("click", this.clickTabHead);
        });
        this.initActive();
        // ????????????align?????????????????????tabLine???????????????
        if (this.align) {
          if (this.align === "center") this.initTabLineAlignCenter();
          if (this.align === "end") this.initTabLineAlignEnd();
        }
      };
      /**
       * @description: ?????????tab
       */  
      initTab = () => {
        this._slot.addEventListener("slotchange", this.listenSlotChange);
      }
      /**
       * @description: ??????tab
       */  
      unloadTab = () => {
        this._slot.removeEventListener("slotchange", this.listenSlotChange);
      }
    
      connectedCallback() {
        this.initTab()
      }
    
      disconnectCallback() {
        this.unloadTab()
      }
    
      attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
          this.dispatchEvent(
            new CustomEvent("change", {
              detail: {
                active: this.active,
              },
            })
          );
        }
        // ??????align?????????????????????tabLine???????????????
        if (name === "align") {
          if (newValue === "center") this.initTabLineAlignCenter();
          if (newValue === "end") this.initTabLineAlignEnd();
        }
      }
    }
    customElements.define("r-tabs", Tabs);
  }
}

export default CustomElement();
