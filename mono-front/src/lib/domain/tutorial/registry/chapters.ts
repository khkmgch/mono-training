import type { Component } from 'svelte';

import WelcomeToSvelte from '../chapters/introduction/welcome-to-svelte/WelcomeToSvelte.svelte';
import YourFirstComponent from '../chapters/introduction/your-first-component/YourFirstComponent.svelte';
import DynamicAttributes from '../chapters/introduction/dynamic-attributes/DynamicAttributes.svelte';
import Styling from '../chapters/introduction/styling/Styling.svelte';
import NestedComponents from '../chapters/introduction/nested-components/NestedComponents.svelte';
import HtmlTags from '../chapters/introduction/html-tags/HtmlTags.svelte';
import State from '../chapters/reactivity/state/State.svelte';
import DeepState from '../chapters/reactivity/deep-state/DeepState.svelte';
import DerivedState from '../chapters/reactivity/derived-state/DerivedState.svelte';
import InspectingState from '../chapters/reactivity/inspecting-state/InspectingState.svelte';
import Effects from '../chapters/reactivity/effects/Effects.svelte';
import UniversalReactivity from '../chapters/reactivity/universal-reactivity/UniversalReactivity.svelte';
import DeclaringProps from '../chapters/props/declaring-props/DeclaringProps.svelte';
import DefaultValues from '../chapters/props/default-values/DefaultValues.svelte';
import SpreadProps from '../chapters/props/spread-props/SpreadProps.svelte';
import IfBlocks from '../chapters/logic/if-blocks/IfBlocks.svelte';
import ElseBlocks from '../chapters/logic/else-blocks/ElseBlocks.svelte';
import ElseIfBlocks from '../chapters/logic/else-if-blocks/ElseIfBlocks.svelte';
import EachBlocks from '../chapters/logic/each-blocks/EachBlocks.svelte';
import KeyedEachBlocks from '../chapters/logic/keyed-each-blocks/KeyedEachBlocks.svelte';
import AwaitBlocks from '../chapters/logic/await-blocks/AwaitBlocks.svelte';
import DomEvents from '../chapters/events/dom-events/DomEvents.svelte';
import InlineHandlers from '../chapters/events/inline-handlers/InlineHandlers.svelte';
import Capturing from '../chapters/events/capturing/Capturing.svelte';
import ComponentEvents from '../chapters/events/component-events/ComponentEvents.svelte';
import SpreadingEvents from '../chapters/events/spreading-events/SpreadingEvents.svelte';
import TextInputs from '../chapters/bindings/text-inputs/TextInputs.svelte';
import NumericInputs from '../chapters/bindings/numeric-inputs/NumericInputs.svelte';
import CheckboxInputs from '../chapters/bindings/checkbox-inputs/CheckboxInputs.svelte';
import SelectBindings from '../chapters/bindings/select-bindings/SelectBindings.svelte';
import GroupInputs from '../chapters/bindings/group-inputs/GroupInputs.svelte';
import SelectMultiple from '../chapters/bindings/select-multiple/SelectMultiple.svelte';
import TextareaInputs from '../chapters/bindings/textarea-inputs/TextareaInputs.svelte';

export interface Exercise {
	id: string;
	title: string;
	component: Component;
	docUrl?: string;
}

export interface Chapter {
	id: string;
	label: string;
	exercises: Exercise[];
}

export const chapters: Chapter[] = [
	{
		id: 'introduction',
		label: 'Introduction',
		exercises: [
			{
				id: 'welcome-to-svelte',
				title: 'Welcome to Svelte',
				component: WelcomeToSvelte,
				docUrl: 'https://svelte.dev/tutorial/svelte/welcome-to-svelte'
			},
			{
				id: 'your-first-component',
				title: 'Your First Component',
				component: YourFirstComponent,
				docUrl: 'https://svelte.dev/tutorial/svelte/your-first-component'
			},
			{
				id: 'dynamic-attributes',
				title: 'Dynamic Attributes',
				component: DynamicAttributes,
				docUrl: 'https://svelte.dev/tutorial/svelte/dynamic-attributes'
			},
			{
				id: 'styling',
				title: 'Styling',
				component: Styling,
				docUrl: 'https://svelte.dev/tutorial/svelte/styling'
			},
			{
				id: 'nested-components',
				title: 'Nested Components',
				component: NestedComponents,
				docUrl: 'https://svelte.dev/tutorial/svelte/nested-components'
			},
			{
				id: 'html-tags',
				title: 'HTML Tags',
				component: HtmlTags,
				docUrl: 'https://svelte.dev/tutorial/svelte/html-tags'
			}
		]
	},
	{
		id: 'reactivity',
		label: 'Reactivity',
		exercises: [
			{
				id: 'state',
				title: 'State',
				component: State,
				docUrl: 'https://svelte.dev/tutorial/svelte/state'
			},
			{
				id: 'deep-state',
				title: 'Deep State',
				component: DeepState,
				docUrl: 'https://svelte.dev/tutorial/svelte/deep-state'
			},
			{
				id: 'derived-state',
				title: 'Derived State',
				component: DerivedState,
				docUrl: 'https://svelte.dev/tutorial/svelte/derived-state'
			},
			{
				id: 'inspecting-state',
				title: 'Inspecting State',
				component: InspectingState,
				docUrl: 'https://svelte.dev/tutorial/svelte/inspecting-state'
			},
			{
				id: 'effects',
				title: 'Effects',
				component: Effects,
				docUrl: 'https://svelte.dev/tutorial/svelte/effects'
			},
			{
				id: 'universal-reactivity',
				title: 'Universal Reactivity',
				component: UniversalReactivity,
				docUrl: 'https://svelte.dev/tutorial/svelte/universal-reactivity'
			}
		]
	},
	{
		id: 'props',
		label: 'Props',
		exercises: [
			{
				id: 'declaring-props',
				title: 'Declaring Props',
				component: DeclaringProps,
				docUrl: 'https://svelte.dev/tutorial/svelte/declaring-props'
			},
			{
				id: 'default-values',
				title: 'Default Values',
				component: DefaultValues,
				docUrl: 'https://svelte.dev/tutorial/svelte/default-values'
			},
			{
				id: 'spread-props',
				title: 'Spread Props',
				component: SpreadProps,
				docUrl: 'https://svelte.dev/tutorial/svelte/spread-props'
			}
		]
	},
	{
		id: 'logic',
		label: 'Logic',
		exercises: [
			{
				id: 'if-blocks',
				title: 'If Blocks',
				component: IfBlocks,
				docUrl: 'https://svelte.dev/tutorial/svelte/if-blocks'
			},
			{
				id: 'else-blocks',
				title: 'Else Blocks',
				component: ElseBlocks,
				docUrl: 'https://svelte.dev/tutorial/svelte/else-blocks'
			},
			{
				id: 'else-if-blocks',
				title: 'Else If Blocks',
				component: ElseIfBlocks,
				docUrl: 'https://svelte.dev/tutorial/svelte/else-if-blocks'
			},
			{
				id: 'each-blocks',
				title: 'Each Blocks',
				component: EachBlocks,
				docUrl: 'https://svelte.dev/tutorial/svelte/each-blocks'
			},
			{
				id: 'keyed-each-blocks',
				title: 'Keyed Each Blocks',
				component: KeyedEachBlocks,
				docUrl: 'https://svelte.dev/tutorial/svelte/keyed-each-blocks'
			},
			{
				id: 'await-blocks',
				title: 'Await Blocks',
				component: AwaitBlocks,
				docUrl: 'https://svelte.dev/tutorial/svelte/await-blocks'
			}
		]
	},
	{
		id: 'events',
		label: 'Events',
		exercises: [
			{
				id: 'dom-events',
				title: 'DOM Events',
				component: DomEvents,
				docUrl: 'https://svelte.dev/tutorial/svelte/dom-events'
			},
			{
				id: 'inline-handlers',
				title: 'Inline Handlers',
				component: InlineHandlers,
				docUrl: 'https://svelte.dev/tutorial/svelte/inline-handlers'
			},
			{
				id: 'capturing',
				title: 'Capturing',
				component: Capturing,
				docUrl: 'https://svelte.dev/tutorial/svelte/capturing'
			},
			{
				id: 'component-events',
				title: 'Component Events',
				component: ComponentEvents,
				docUrl: 'https://svelte.dev/tutorial/svelte/component-events'
			},
			{
				id: 'spreading-events',
				title: 'Spreading Events',
				component: SpreadingEvents,
				docUrl: 'https://svelte.dev/tutorial/svelte/spreading-events'
			}
		]
	},
	{
		id: 'bindings',
		label: 'Bindings',
		exercises: [
			{
				id: 'text-inputs',
				title: 'Text Inputs',
				component: TextInputs,
				docUrl: 'https://svelte.dev/tutorial/svelte/text-inputs'
			},
			{
				id: 'numeric-inputs',
				title: 'Numeric Inputs',
				component: NumericInputs,
				docUrl: 'https://svelte.dev/tutorial/svelte/numeric-inputs'
			},
			{
				id: 'checkbox-inputs',
				title: 'Checkbox Inputs',
				component: CheckboxInputs,
				docUrl: 'https://svelte.dev/tutorial/svelte/checkbox-inputs'
			},
			{
				id: 'select-bindings',
				title: 'Select Bindings',
				component: SelectBindings,
				docUrl: 'https://svelte.dev/tutorial/svelte/select-bindings'
			},
			{
				id: 'group-inputs',
				title: 'Group Inputs',
				component: GroupInputs,
				docUrl: 'https://svelte.dev/tutorial/svelte/group-inputs'
			},
			{
				id: 'select-multiple',
				title: 'Select Multiple',
				component: SelectMultiple,
				docUrl: 'https://svelte.dev/tutorial/svelte/select-multiple'
			},
			{
				id: 'textarea-inputs',
				title: 'Textarea Inputs',
				component: TextareaInputs,
				docUrl: 'https://svelte.dev/tutorial/svelte/textarea-inputs'
			}
		]
	}
];
