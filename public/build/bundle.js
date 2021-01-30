
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const groceriesLists = writable([
      {
        title: 'My first groceries list',
        content: [
          {
            label: 'Baguette',
            quantity: 2,
          },
          {
            label: 'Liquid Soap',
            quantity: 1,
          },
        ],
      },
      {
        title: 'My second groceries list',
        content: [
          {
            label: 'Vanilla ice cream',
            quantity: 1,
          },
          {
            label: 'Toothpaste',
            quantity: 1,
          },
        ],
      },
    ]);

    const selectedGroceriesList = writable({});

    /* src/GroceriesListSelect/GroceriesListSelect.svelte generated by Svelte v3.32.0 */
    const file = "src/GroceriesListSelect/GroceriesListSelect.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (57:8) {#each groceries_lists as list}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*list*/ ctx[17].title + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*list*/ ctx[17];
    			option.value = option.__value;
    			add_location(option, file, 57, 12, 1730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groceries_lists*/ 1 && t_value !== (t_value = /*list*/ ctx[17].title + "")) set_data_dev(t, t_value);

    			if (dirty & /*groceries_lists*/ 1 && option_value_value !== (option_value_value = /*list*/ ctx[17])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(57:8) {#each groceries_lists as list}",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if isGroceriesListCreateModaleDisplayed}
    function create_if_block(ctx) {
    	let div;
    	let input0;
    	let t0;
    	let br0;
    	let t1;
    	let input1;
    	let t2;
    	let input2;
    	let t3;
    	let br1;
    	let t4;
    	let button0;
    	let t6;
    	let br2;
    	let t7;
    	let button1;
    	let t9;
    	let br3;
    	let t10;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*newGroceriesListContent*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			input1 = element("input");
    			t2 = space();
    			input2 = element("input");
    			t3 = space();
    			br1 = element("br");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Add product";
    			t6 = space();
    			br2 = element("br");
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Done";
    			t9 = space();
    			br3 = element("br");
    			t10 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "List name");
    			add_location(input0, file, 67, 8, 2021);
    			add_location(br0, file, 68, 8, 2108);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Product");
    			add_location(input1, file, 69, 8, 2122);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "placeholder", "Quantity");
    			add_location(input2, file, 70, 8, 2215);
    			add_location(br1, file, 71, 8, 2314);
    			add_location(button0, file, 72, 8, 2328);
    			add_location(br2, file, 73, 8, 2387);
    			add_location(button1, file, 74, 8, 2401);
    			add_location(br3, file, 75, 8, 2450);
    			add_location(ul, file, 76, 8, 2464);
    			add_location(div, file, 66, 4, 2007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			set_input_value(input0, /*newGroceriesListName*/ ctx[3]);
    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			append_dev(div, input1);
    			set_input_value(input1, /*newGroceriesListContentLabel*/ ctx[4]);
    			append_dev(div, t2);
    			append_dev(div, input2);
    			set_input_value(input2, /*newGroceriesListContentQuantity*/ ctx[5]);
    			append_dev(div, t3);
    			append_dev(div, br1);
    			append_dev(div, t4);
    			append_dev(div, button0);
    			append_dev(div, t6);
    			append_dev(div, br2);
    			append_dev(div, t7);
    			append_dev(div, button1);
    			append_dev(div, t9);
    			append_dev(div, br3);
    			append_dev(div, t10);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[14]),
    					listen_dev(button0, "click", /*addProduct*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*addList*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newGroceriesListName*/ 8 && input0.value !== /*newGroceriesListName*/ ctx[3]) {
    				set_input_value(input0, /*newGroceriesListName*/ ctx[3]);
    			}

    			if (dirty & /*newGroceriesListContentLabel*/ 16 && input1.value !== /*newGroceriesListContentLabel*/ ctx[4]) {
    				set_input_value(input1, /*newGroceriesListContentLabel*/ ctx[4]);
    			}

    			if (dirty & /*newGroceriesListContentQuantity*/ 32 && to_number(input2.value) !== /*newGroceriesListContentQuantity*/ ctx[5]) {
    				set_input_value(input2, /*newGroceriesListContentQuantity*/ ctx[5]);
    			}

    			if (dirty & /*newGroceriesListContent*/ 64) {
    				each_value = /*newGroceriesListContent*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:0) {#if isGroceriesListCreateModaleDisplayed}",
    		ctx
    	});

    	return block;
    }

    // (78:12) {#each newGroceriesListContent as newGroceriesListContent}
    function create_each_block(ctx) {
    	let li;
    	let t0_value = /*newGroceriesListContent*/ ctx[6].label + "";
    	let t0;
    	let t1;
    	let t2_value = /*newGroceriesListContent*/ ctx[6].quantity + "";
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" x");
    			t2 = text(t2_value);
    			add_location(li, file, 78, 16, 2556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newGroceriesListContent*/ 64 && t0_value !== (t0_value = /*newGroceriesListContent*/ ctx[6].label + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*newGroceriesListContent*/ 64 && t2_value !== (t2_value = /*newGroceriesListContent*/ ctx[6].quantity + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(78:12) {#each newGroceriesListContent as newGroceriesListContent}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let label;
    	let t0;
    	let select;
    	let t1;
    	let button;
    	let t3;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*groceries_lists*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*isGroceriesListCreateModaleDisplayed*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text("Select a groceries list\n    \n    ");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			button = element("button");
    			button.textContent = "Create new groceries list";
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (/*selected_groceries_list*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[10].call(select));
    			add_location(select, file, 55, 4, 1567);
    			add_location(label, file, 52, 0, 1483);
    			add_location(button, file, 61, 0, 1812);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selected_groceries_list*/ ctx[1]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[10]),
    					listen_dev(
    						select,
    						"change",
    						function () {
    							if (is_function(/*updateSelectedGroceriesList*/ ctx[7](/*selected_groceries_list*/ ctx[1]))) /*updateSelectedGroceriesList*/ ctx[7](/*selected_groceries_list*/ ctx[1]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*groceries_lists*/ 1) {
    				each_value_1 = /*groceries_lists*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*selected_groceries_list, groceries_lists*/ 3) {
    				select_option(select, /*selected_groceries_list*/ ctx[1]);
    			}

    			if (/*isGroceriesListCreateModaleDisplayed*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GroceriesListSelect", slots, []);
    	let groceries_lists;

    	groceriesLists.subscribe(value => {
    		$$invalidate(0, groceries_lists = value);
    	});

    	let selected_groceries_list = selectedGroceriesList;

    	selectedGroceriesList.subscribe(value => {
    		$$invalidate(1, selected_groceries_list = value);
    	});

    	selectedGroceriesList.set(groceries_lists[0]);

    	const updateSelectedGroceriesList = selected => {
    		selectedGroceriesList.update(() => selected);
    	};

    	let isGroceriesListCreateModaleDisplayed = false;
    	let newGroceriesListName = "";
    	let newGroceriesListContent = [];
    	let newGroceriesListContentLabel = "";
    	let newGroceriesListContentQuantity = 0;

    	const addProduct = () => {
    		$$invalidate(6, newGroceriesListContent = [
    			...newGroceriesListContent,
    			{
    				"label": newGroceriesListContentLabel,
    				"quantity": newGroceriesListContentQuantity
    			}
    		]);

    		$$invalidate(4, newGroceriesListContentLabel = "");
    		$$invalidate(5, newGroceriesListContentQuantity = 0);
    	};

    	const addList = () => {
    		groceriesLists.update(() => [
    			...groceries_lists,
    			{
    				"title": newGroceriesListName,
    				"content": newGroceriesListContent
    			}
    		]);

    		$$invalidate(3, newGroceriesListName = "");
    		$$invalidate(6, newGroceriesListContent = []);
    		$$invalidate(4, newGroceriesListContentLabel = "");
    		$$invalidate(5, newGroceriesListContentQuantity = 0);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GroceriesListSelect> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected_groceries_list = select_value(this);
    		$$invalidate(1, selected_groceries_list);
    		$$invalidate(0, groceries_lists);
    	}

    	const click_handler = () => $$invalidate(2, isGroceriesListCreateModaleDisplayed = !isGroceriesListCreateModaleDisplayed);

    	function input0_input_handler() {
    		newGroceriesListName = this.value;
    		$$invalidate(3, newGroceriesListName);
    	}

    	function input1_input_handler() {
    		newGroceriesListContentLabel = this.value;
    		$$invalidate(4, newGroceriesListContentLabel);
    	}

    	function input2_input_handler() {
    		newGroceriesListContentQuantity = to_number(this.value);
    		$$invalidate(5, newGroceriesListContentQuantity);
    	}

    	$$self.$capture_state = () => ({
    		groceriesLists,
    		selectedGroceriesList,
    		groceries_lists,
    		selected_groceries_list,
    		updateSelectedGroceriesList,
    		isGroceriesListCreateModaleDisplayed,
    		newGroceriesListName,
    		newGroceriesListContent,
    		newGroceriesListContentLabel,
    		newGroceriesListContentQuantity,
    		addProduct,
    		addList
    	});

    	$$self.$inject_state = $$props => {
    		if ("groceries_lists" in $$props) $$invalidate(0, groceries_lists = $$props.groceries_lists);
    		if ("selected_groceries_list" in $$props) $$invalidate(1, selected_groceries_list = $$props.selected_groceries_list);
    		if ("isGroceriesListCreateModaleDisplayed" in $$props) $$invalidate(2, isGroceriesListCreateModaleDisplayed = $$props.isGroceriesListCreateModaleDisplayed);
    		if ("newGroceriesListName" in $$props) $$invalidate(3, newGroceriesListName = $$props.newGroceriesListName);
    		if ("newGroceriesListContent" in $$props) $$invalidate(6, newGroceriesListContent = $$props.newGroceriesListContent);
    		if ("newGroceriesListContentLabel" in $$props) $$invalidate(4, newGroceriesListContentLabel = $$props.newGroceriesListContentLabel);
    		if ("newGroceriesListContentQuantity" in $$props) $$invalidate(5, newGroceriesListContentQuantity = $$props.newGroceriesListContentQuantity);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		groceries_lists,
    		selected_groceries_list,
    		isGroceriesListCreateModaleDisplayed,
    		newGroceriesListName,
    		newGroceriesListContentLabel,
    		newGroceriesListContentQuantity,
    		newGroceriesListContent,
    		updateSelectedGroceriesList,
    		addProduct,
    		addList,
    		select_change_handler,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class GroceriesListSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroceriesListSelect",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/GroceriesListDisplay/GroceriesListDisplay.svelte generated by Svelte v3.32.0 */
    const file$1 = "src/GroceriesListDisplay/GroceriesListDisplay.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (12:4) {#each selected_groceries_list.content as content}
    function create_each_block$1(ctx) {
    	let li;
    	let t0_value = /*content*/ ctx[1].label + "";
    	let t0;
    	let t1;
    	let t2_value = /*content*/ ctx[1].quantity + "";
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" x");
    			t2 = text(t2_value);
    			add_location(li, file$1, 12, 8, 315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selected_groceries_list*/ 1 && t0_value !== (t0_value = /*content*/ ctx[1].label + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*selected_groceries_list*/ 1 && t2_value !== (t2_value = /*content*/ ctx[1].quantity + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(12:4) {#each selected_groceries_list.content as content}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t0_value = /*selected_groceries_list*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let ul;
    	let each_value = /*selected_groceries_list*/ ctx[0].content;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$1, 9, 0, 206);
    			add_location(ul, file$1, 10, 0, 247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected_groceries_list*/ 1 && t0_value !== (t0_value = /*selected_groceries_list*/ ctx[0].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*selected_groceries_list*/ 1) {
    				each_value = /*selected_groceries_list*/ ctx[0].content;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GroceriesListDisplay", slots, []);
    	let selected_groceries_list;

    	selectedGroceriesList.subscribe(value => {
    		$$invalidate(0, selected_groceries_list = value);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GroceriesListDisplay> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		selectedGroceriesList,
    		selected_groceries_list
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected_groceries_list" in $$props) $$invalidate(0, selected_groceries_list = $$props.selected_groceries_list);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected_groceries_list];
    }

    class GroceriesListDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroceriesListDisplay",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.0 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h1;
    	let t0_value = /*config*/ ctx[0].applicationName + "";
    	let t0;
    	let t1;
    	let main;
    	let grocerieslistselect;
    	let t2;
    	let hr;
    	let t3;
    	let grocerieslistdisplay;
    	let current;
    	grocerieslistselect = new GroceriesListSelect({ $$inline: true });
    	grocerieslistdisplay = new GroceriesListDisplay({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			main = element("main");
    			create_component(grocerieslistselect.$$.fragment);
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			create_component(grocerieslistdisplay.$$.fragment);
    			attr_dev(h1, "class", "svelte-1t3rtxy");
    			add_location(h1, file$2, 8, 1, 216);
    			add_location(div, file$2, 7, 0, 209);
    			add_location(hr, file$2, 14, 1, 293);
    			attr_dev(main, "class", "svelte-1t3rtxy");
    			add_location(main, file$2, 12, 0, 259);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(grocerieslistselect, main, null);
    			append_dev(main, t2);
    			append_dev(main, hr);
    			append_dev(main, t3);
    			mount_component(grocerieslistdisplay, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*config*/ 1) && t0_value !== (t0_value = /*config*/ ctx[0].applicationName + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grocerieslistselect.$$.fragment, local);
    			transition_in(grocerieslistdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grocerieslistselect.$$.fragment, local);
    			transition_out(grocerieslistdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(grocerieslistselect);
    			destroy_component(grocerieslistdisplay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { config } = $$props;
    	const writable_props = ["config"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		config,
    		selectedGroceriesList,
    		GroceriesListSelect,
    		GroceriesListDisplay
    	});

    	$$self.$inject_state = $$props => {
    		if ("config" in $$props) $$invalidate(0, config = $$props.config);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [config];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { config: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*config*/ ctx[0] === undefined && !("config" in props)) {
    			console.warn("<App> was created without expected prop 'config'");
    		}
    	}

    	get config() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var applicationName = "Groceries Planner!";
    var config = {
    	applicationName: applicationName
    };

    const app = new App({
        target: document.body,
        props: {
            config,
        },
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
