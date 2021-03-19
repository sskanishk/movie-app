import React, { useState, Fragment, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import Dropdown from 'react-dropdown';
import ReactFlow, { isNode, ReactFlowProvider, removeElements, addEdge, updateEdge, Background, Controls, MiniMap, Handle, getBezierPath, getSmoothStepPath, getMarkerEnd } from 'react-flow-renderer';
import { ToastContainer, toast } from "react-toastify";
import Checkbox from 'react-bootstrap/lib/Checkbox';
import ApiActions from '../../actions/ApiActions';
import { useHistory, Prompt } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import dagre from 'dagre';
import Autosuggest from 'react-autosuggest';
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import shortid from 'shortid';
import UnSavedWarning from './Tools/UnsavedWarning';



var initialElements = [
	{
		id: "1",
		type: "input",
		data: {
			label: "Hi, I am ----- calling from --- ",
			"heading": "Introduction"
		},
		position: { x: 0, y: 0 }
	},

	{
		id: "6",
		data: { label: "Thank you for your time,have a nice day  ", "heading": "Ending" },
		position: { x: 0, y: 0 },
		type: "output"
	}

]
const dynamicProps = [
  {
    name: '@name'
  },
  {
    name: '@mobile'
  },
  {
	  name:'@email'
  }
  
]

const MindNode = () => {
	const reactFlowWrapper = useRef(null);
	const [teleproject, setProject] = useState({})
	const [script, setScript] = useState({})
	const [scriptId, setScriptId] = useState("")
	const [showEdgeForm, setEdgeForm] = useState(false)
	const [reactFlowInstance, setReactFlowInstance] = useState(null);
	const [suggestions,setSuggestions]=useState([])
	const [unSaved, setUnSaved] = useState(null);
	const [Prompt, setDirty, setPristine] = UnSavedWarning();
	const [teleprojectTitle, setProjectTitle] = useState({})
	const [ taskProps, setTaskProps ] = useState([]);

	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	const getLayoutedElements = (elements) => {
		// debugger;
		// const isHorizontal = false;
		dagreGraph.setGraph({ rankdir: 'TB', align: 'UL' });
		elements.forEach((el) => {
			if (isNode(el)) {
				dagreGraph.setNode(el.id, { width: 250, height: 200 });
			} else {
				dagreGraph.setEdge(el.source, el.target);
			}
		});
		dagre.layout(dagreGraph);
		return elements.map((el) => {
			if (isNode(el)) {
				const nodeWithPosition = dagreGraph.node(el.id);
				// el.targetPosition = isHorizontal ? 'left' : 'top';
				// el.sourcePosition = isHorizontal ? 'right' : 'bottom';
				// unfortunately we need this little hack to pass a slighltiy different position
				// in order to notify react flow about the change
				el.position = {
					x: nodeWithPosition.x + Math.random() / 1000,
					y: nodeWithPosition.y,
				};
			}
			return el;
		});
	};

	const onElementsRemove = useCallback(
		(elementsToRemove) =>
			setElements((els) => removeElements(elementsToRemove, els)),
		[]
	);


	const AutoPosition = useCallback(
		// if script===undefined it use elements else original script value
		(script = elements) => {
			// debugger;
			const layoutedElements = getLayoutedElements(script);
			setElements(layoutedElements);
            	if (reactFlowInstance && elements.length) {
				reactFlowInstance.fitView();
			}
		},
		[script]
	);


	useEffect(() => {

		let history = window.location.href.split('/').reverse()[0]
		if (history) {
			let isMounted = true;

			ApiActions.getTeleProject(history).then(resp2 => {
				setProject(resp2.id)
				setProjectTitle(resp2.title)

				if(resp2.taskProps && false) {
					let taskProps = resp2.taskProps.map((i) => { i.name = '@'+i.name })
					setTaskProps(taskProps)
				}else{
					setTaskProps(dynamicProps)
				}

				
				ApiActions.getScript(history).then(res => {
					console.log("alice", res)

					// let len=res.length;
					// let scr=res[len-1];
					// debugger;
					res.map(scr => {
						setElements(scr.script)
						// AutoPosition(scr.script)
						setScriptId(scr.id)
					})
				})
			})
			// AutoPosition()
			return () => { isMounted = false };
		}


	}, []);

	const customNodeStyles = {
		background: '#2aa84agtf',
		color: 'green',
		borderRadius: '38px'
	};

	const onDragStart = (event, nodeType) => {
		// debugger;
		event.dataTransfer.setData('application/reactflow', nodeType);
		event.dataTransfer.effectAllowed = 'move';
	};

	const onLoad = (reactFlowInstance) => {
		setReactFlowInstance(reactFlowInstance);
	};

	const onDragOver = (event) => {
		// debugger;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	};

	const onNodeDragStop = (event, node) => { 
		LockPosition(node)
	}
	const onNodeDrag = () => {
		setUnSaved(true);
		setDirty();
		console.log('onnodedrag')
	}




	const CustomEdge = ({
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		style,
		outcome,
		data,
		source,
		target,
		arrowHeadType,
		label,
		animated,
		markerEndId,
	}) => {
		const edgePath = getSmoothStepPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
			borderRadius: 15
		});

		const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);
		return (
			<>
				<path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} onClick={() => showForm(

					id, label, source, target, data && data.outcome, style, animated
				)} />
				<text>
					<textPath href={`#${id}`} style={{ fontSize: '12px' }} startOffset="50%" textAnchor="middle">
						{data && data.outcome || label}
					</textPath>
				</text>
			</>
		);
	}

	const showForm = (id, label, source, target, outcome, style, animated) => {
		console.log(id, source, label, target, outcome)
		setEdgeForm(true)
		showCrud(false)
		if (outcome)
			setEdge({
				"id": id,
				"source": source,
				"target": target,
				"label": label,
				"data": {
					"outcome": outcome
				},
				"style": style,
				"type": "step",
				"animated": true


			})
		else
			setEdge({
				"id": id,
				"source": source,
				"target": target,
				"label": label,
				"style": style,
				"type": "step",
				"animated": false
			})

	}

	const CustomNodeComponentInput = (data) => {
		console.log(data)
		const setData = (node) => {
			console.log(node)
			setNode(node)
			setHeading(node.data.heading || "Introduction")
			showCrud(!crud)
			console.log("activenode", node)
		}
		return (
			<div style={customNodeStyles} onClick={() => setData(data)}>
				<Handle type="source" position="bottom" style={{ borderRadius: 0 }} onConnect={onConnect} />

				<div className="heading-node-i">{data.data.heading}</div>
				<div >{data.data.label}</div>
				<div className="caller-cue">{data.data.callerCueText}</div>
			</div>
		);
	};

	const CustomNodeComponentOutput = (data) => {
		console.log(data)
		const setData = (node) => {
			console.log(node)
			setNode(node)
			setHeading(node.data.heading || "End")
			showCrud(!crud)
			console.log("activenode", node)
		}
		return (
			<div style={customNodeStyles} onClick={() => setData(data)}>
				<Handle type="target" position="top" style={{ borderRadius: 0 }} onConnect={onConnect} />
				{/* <ToastContainer draggable={true} /> */}
				<div className="heading-node-i">{data.data.heading}</div>
				<div >{data.data.label}</div>
				<div className="caller-cue">{data.data.callerCueText}</div>
				{/* <Handle
			type="source"
			position="right"
			id="a"
			style={{ top: '30%', borderRadius: 0 }}
		/> */}
				{/* <input/> */}
				{/* <Handle
			type="source"
			position="right"
			id="b"
			style={{ top: '70%', borderRadius: 0 }}
		/> */}
			</div>
		);
	};

	const CustomNodeComponentDefault = (data) => {
		console.log(data)
		const setData = (node) => {
			console.log(node)
			setNode(node)
			setHeading(node.data.heading || "Main Pitch")
			showCrud(!crud)
			console.log("activenode", node)
		}
		return (
			<div style={customNodeStyles} onClick={() => setData(data)}>
				<Handle type="source" position="bottom" style={{ borderRadius: 0 }} onConnect={onConnect} />
				<Handle type="target" position="top" style={{ borderRadius: 0 }} onConnect={onConnect} />
				{/* <ToastContainer draggable={true} /> */}
				<div className="heading-node-i">{data.data.heading}</div>
				<div >{data.data.label}</div>
				<div className="caller-cue">{data.data.callerCueText}</div>
				{/* <Handle
			type="source"
			position="right"
			id="a"
			style={{ top: '30%', borderRadius: 0 }}
		/> */}
				{/* <input/> */}
				{/* <Handle
			type="source"
			position="right"
			id="b"
			style={{ top: '70%', borderRadius: 0 }}
		/> */}
			</div>
		);
	};
	const nodeTypes = {
		input: CustomNodeComponentInput,
		output: CustomNodeComponentOutput,
		default: CustomNodeComponentDefault
	};
	console.log(activenode)
	const [activenode, setNode] = useState({})
	const [activeedge, setEdge] = useState({})
	const [elements, setElements] = useState(initialElements);
	console.log(script)
	const [name, setName] = useState("")
	const [crud, showCrud] = useState(false)

	const [heading, setHeading] = useState("")
	const [callercue, setcallercue] = useState(false)
	const [description, setDesc] = useState("")
	const [outcomeFlag, setOutcomeTrue] = useState(false)
	const addNode = (type, position) => {
		// debugger;
		console.log(type)
		if (type === "input" || type === "output") {
			setElements(e => e.concat({
				id: shortid.generate(),
				data: { label: type, heading: type },
				type: type,
				position: position
			}));
		}

		else {
			setElements(e => e.concat({
				id: shortid.generate(),
				data: { label: "Default", heading: "default" },
				position: position
			}));
		}

	};


	const onDrop = (event) => {
		event.preventDefault();
		const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
		const type = event.dataTransfer.getData('application/reactflow');
		const position = reactFlowInstance.project({
			x: event.clientX - reactFlowBounds.left,
			y: event.clientY - reactFlowBounds.top,
		});
		addNode(type, position)
		// setElements((es) => es.concat(newNode));
	};
	const setCallerCueText = (e) =>{

		let objCopy = cloneDeep(activenode)
		objCopy.data.callerCueText = e.target.value;
		let position = {
			x: 0,
			y: 0
		}
		position.x = activenode.xPos;
		position.y = activenode.yPos;

		objCopy["position"] = position
		setNode(
			objCopy
		)
		elements.splice(elements.findIndex(function(i){
			return i.id === activenode.id;
		}), 1);
		elements.push(objCopy)
		// let index = activenode.id - 1;
		// elements[index] = objCopy
		setElements(elements)

	}
	const setHeadingData = (e) => {
	
		let objCopy = cloneDeep(activenode)
		objCopy.data.heading = e.value;
		let position = {
			x: 0,
			y: 0
		}
		position.x = activenode.xPos;
		position.y = activenode.yPos;

		objCopy["position"] = position
		console.log("captain", objCopy)
		setNode(
			objCopy
		)
		elements.splice(elements.findIndex(function(i){
			return i.id === activenode.id;
		}), 1);
		elements.push(objCopy)
		// let index = activenode.id - 1;
		// elements[index] = objCopy
		setElements(elements)
	}

	const setNodeLabel = (val) => {
		// debugger;
		let objCopy = cloneDeep(activenode)
		objCopy.data.label = val;
		console.log("obj", activenode)
		let position = {
			x: 0,
			y: 0
		}
		position.x = activenode.xPos;
		position.y = activenode.yPos;

		objCopy["position"] = position
		console.log("marvel", objCopy)
		setNode(
			objCopy
		)
		elements.splice(elements.findIndex(function(i){
			return i.id === activenode.id;
		}), 1);
		elements.push(objCopy)
		// let index = activenode.id - 1;
		// elements[index] = objCopy
		setElements(elements)
	};

	const setEdgeOutcome = (e) => {
		let objCopy = cloneDeep(activeedge)
		objCopy.data.outcome = e.target.value;
		console.log("obj", activeedge)

		setEdge(
			objCopy
		)
		elements.map((el, index) => {
			if (el.id === activeedge.id)
				elements[index] = objCopy
		})
		setElements(elements)
	};

	const edgeTypes = {
		step: CustomEdge,
	};


	const setEdgeLabel = (e) => {
		let objCopy = cloneDeep(activeedge)
		objCopy.label = e.target.value;
		console.log("obj", activeedge)

		setEdge(
			objCopy
		)
		elements.map((el, index) => {
			if (el.id === activeedge.id)
				elements[index] = objCopy

		})
		setElements(elements)
	}


	const onConnect = (params) => setElements((els) => addEdge(

		outcomeFlag ?
			{
				id: `e${params.source}-${params.target}`,
				source: params.source,
				target: params.target,
				label: "label",
				type: "step",
				animated: outcomeFlag,
				data: {
					outcome: "outcome"
				}
			} :
			{
				id: `e${params.source}-${params.target}`,
				source: params.source,
				target: params.target,
				label: "label",
				type: "step",
				animated: outcomeFlag,
			}, els));
	const onEdgeUpdate = (oldEdge, newConnection) =>
		setElements((els) => updateEdge(oldEdge, newConnection, els));

	let headings = [
		{ label: "Introduction", value: "Introduction" },
		{ label: "Main Pitch", value: "Main Pitch" },
		{ label: "Quick Pitch", value: "Quick Pitch" }
	]
	const submitForm = (e) => {

		console.log(elements)
		e && e.preventDefault();
		let dataToSend = {}
		if (scriptId)
			dataToSend = {
				"teleproject": teleproject,
                "scriptPublished":false,
				"script": elements,
				"scriptId": scriptId
			}
		else
			dataToSend = {
				"teleproject": teleproject,
                "scriptPublished":false,
				"script": elements
			}

		console.log(dataToSend)
		ApiActions.createScript(dataToSend).then(resp => {
			// toast("created")
            console.log("Final",resp)
            let updatedScript=resp&&resp.data&&resp.data.script;
            setElements(updatedScript)
						setUnSaved(false)
						setPristine();
		}).catch(err => {
			toast("error")
		})

	}
    const publishScript =(e)=>{

        e.preventDefault();
		let dataToSend = {}
		if (scriptId)
			dataToSend = {
				"teleproject": teleproject,
                "scriptPublished":true,
				"script": elements,
				"scriptId": scriptId
			}
		else
			dataToSend = {
				"teleproject": teleproject,
                "scriptPublished":true,
				"script": elements
			}

		console.log(dataToSend)
		ApiActions.createScript(dataToSend).then(resp => {
			toast("Published")
            console.log("Final",resp)
            let updatedScript=resp&&resp.data&&resp.data.script;
            setElements(updatedScript)
						setUnSaved(false)
						setPristine();
		}).catch(err => {
			toast("error")
		})
    }

		const LockPosition = (active_node) => {
			let objCopy = cloneDeep(active_node)
			let position = {
				x: 0,
				y: 0
			}
			position.x = active_node.position.x;
			position.y = active_node.position.y;
	
			objCopy["position"] = position
			setNode(
				objCopy
			)
			elements.splice(elements.findIndex(function(i){
				return i.id === active_node.id;
			}), 1);
			elements.push(objCopy)
			// let index = active_node.id - 1;
			// elements[index] = objCopy
			setElements(elements)
	
			
		}
		function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestions(value) {
	// debugger
  const escapedValue = escapeRegexCharacters(value.trim());
  
  if (escapedValue === '') {
    return [];
  }

  const regex = new RegExp('^' + escapedValue, 'i');

  return taskProps.filter(language => regex.test(language.name));
}

function getSuggestionValue(suggestion) {
  return suggestion.name;
}

function renderSuggestion(suggestion) {
  return (
    <span>{suggestion.name}</span>
  );
}

function reverse(s) {
  return s.split('').reverse().join('');
}


		 const onChange = (event, { newValue, method }) => {
    // debugger;
	console.log("fury",newValue)
    if(method === 'click' || method === 'down' || method === 'up' || method === 'enter') {
      // let temp = [...this.state.value].reverse().join('');
      // temp = temp.split('@')[1];
      var s = activenode.data.label;
      var rev = [...s].reverse().join('');
      var s1 = rev.substring(rev.indexOf("@")+1);
      var new_str = [...s1.trim()].reverse().join('');
	  setNodeLabel(new_str + " " + newValue)
      
    } else  setNodeLabel(newValue)
  };
  
  const disableEnter = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
    }
  }

  const onSuggestionsFetchRequested = ({ value }) => {
		// debugger;
    value = value.split(" ").pop();
    // value = value.substring(1);
	let valS=getSuggestions(value)
	setSuggestions(valS)
    // this.setState({
    //   suggestions: getSuggestions(value)
    // });
  };

  const onSuggestionsClearRequested = () => {
	  setSuggestions([])
   
  };
  

 const inputProps = {
      placeholder: "Type '@' for list of dynamic properties",
      value:activenode&&activenode.data&&activenode.data.label,
     onChange: onChange
    };

		const Item = ({ entity: { name } }) => <div>{`${name}`}</div>;


	return (
        <div>
            <div className="script-header">  
						 <div className="script-heaing">
							{<h4>{teleprojectTitle.toString()}</h4>}
							{unSaved && <span>UnSaved</span>}
						 </div>
						 <button  className="save-btn" onClick={submitForm}> Save </button>
						 <button  className="publish-btn" onClick={publishScript}> Publish </button>
             </div>
    		<div className="i-wrap">
               
    			<ToastContainer draggable={true} />
    			<ReactFlowProvider>
    				<div className="toolbar-script">
    					<div className="wrapper-i">
    						
    						<div className="card-wrap" onDragStart={(event) => onDragStart(event, 'input')} draggable>
    							<div className="card-false" >
    								<img src={require("../../assets/images/int_script_toolbar/Icons_start-end.svg")} />
    							</div>
    							<div className="label-i">Start/End</div>
    						</div>
    						
    						{/* <div className="card-wrap" onDragStart={(event) => onDragStart(event, 'output')} draggable>
    							<div className="card-false" >
    								<img src={require("../../assets/images/int_script_toolbar/Icons_start-end.svg")} />
    							</div>
    							<div className="label-i">End</div>
    						</div> */}
    						
    						<div className="card-wrap" onDragStart={(event) => onDragStart(event, 'default')} draggable>
    							<div className="card-false">
    								<img src={require("../../assets/images/int_script_toolbar/Icons_text_block.svg")} />
    							</div>
    							<div className="label-i">Text</div>
    						</div>
    						
    						<div className="card-wrap" onDragStart={(event) => onDragStart(event, 'default')} draggable>
    							<div className="card-false">
    								<img src={require("../../assets/images/int_script_toolbar/Icons_quick_pitch.svg")} />
    							</div>
    							<div className="label-i">Quick Pitch</div>
    						</div>
    
    						<div className="card-wrap" onDragStart={(event) => onDragStart(event, 'default')} draggable>
    							<div className="card-false">
    								<img src={require("../../assets/images/int_script_toolbar/Icons_additional_responses.svg")} />
    							</div>
    							<div className="label-i">DataCollection</div>
    						</div>
    
    						<div className="card-wrap" onClick={() => setOutcomeTrue(!outcomeFlag)}>
    							<div className={`card-${outcomeFlag}`}>
    								<img className="un-dragable" src={require("../../assets/images/int_script_toolbar/Icons_outcome.svg")} />
    							</div>
    							<div className="label-i">Outcomes</div>
    						</div>
    
    						<div className="card-wrap">
    							<div className="card-false">
    								<img className="un-dragable" src={require("../../assets/images/int_script_toolbar/Icons_faqs.svg")} />
    							</div>
    							<div className="label-i">FAQs</div>
    						</div>
    					</div>
    				</div>
    				
    				<div className="flow" ref={reactFlowWrapper}>
    					<ReactFlow
    						elements={elements}
    						nodeTypes={nodeTypes}
    						edgeTypes={edgeTypes}
    						onLoad={onLoad}
    						style={{ width: '100%', minHeight: '90vh' }}
    						onConnect={onConnect}
    						connectionLineStyle={{ stroke: "#ddd", strokeWidth: 2 }}
    						connectionLineType="step"
    						snapToGrid={true}
    						onEdgeUpdate={onEdgeUpdate}
    						snapGrid={[16, 16]}
    						onDrop={onDrop}
    						onDragOver={onDragOver}
    						onElementsRemove={onElementsRemove}
								onNodeDragStop={onNodeDragStop}
								onNodeDrag={onNodeDrag}
    					>
    						<Background
    							color="#888"
    							gap={16}
    						/>
    						{/* <MiniMap 
    									nodeColor={n=>{
    											if(n.type === 'input') return 'blue';
    											
    											return '#FFCC00'
    									}} /> */}
    						<Controls />
    
    					</ReactFlow>
    				</div>
    				{crud ? <div className="crud-form">
    
    					<div className="in-form">
    
    						<div className="heading"> Text editor </div>
    						<div>
    							<div className="title">Title</div>
    							<Dropdown 
								className="script-dropdown"
								options={headings}
    							onChange={setHeadingData}
    							value={activenode.data.heading ||"Heading"}
    							placeholder="Select an option" />
								 <div 	className="autosuggest-script">
								 	 {/* <Autosuggest 
	     								   suggestions={suggestions}
										
	     								   onSuggestionsFetchRequested={onSuggestionsFetchRequested}
	     								   onSuggestionsClearRequested={onSuggestionsClearRequested}
	     								   // renderInputComponent={this.renderCustomInput}
	     								   shouldRenderSuggestions={(value, reason) => {
	     								     // debugger;
	     								     value = value.split(" ").pop();
	     								     // value = value.substring(1);
	     								     const temp = value.charAt(0) === '@'
	     								     return temp
	     								   }}
	     								   getSuggestionValue={getSuggestionValue}
	     								   renderSuggestion={renderSuggestion}
	     								   inputProps={inputProps} /> */}
													    <ReactTextareaAutocomplete
      className="my-textarea"
      onChange={e => console.log(e.target.value)}
      loadingComponent={() => <span>Loading</span>}
      trigger={{
        "@": {
          dataProvider: token => {
            return dynamicProps;
          },
          component: Item,
          output: (item, trigger) => '@'+item.name
        }
      }}
    />
								 </div>
    							{/* <Checkbox className="checkbox" checked={callercue} onChange={() => setcallercue(!callercue)}
    							><div className="all-oc">Caller Cue</div></Checkbox> */}
								<div className="title-cue">Caller Cue </div>
    							<textarea style={{width: "240px"}} value={activenode.data.callerCueText||""}  onChange={setCallerCueText}/>
								
    						</div>
    						<button onClick={submitForm}> Submit</button>
								{/* <hr /> */}
								{/* <button onClick={LockPosition}>LockPosition</button> */}
    					</div>
    				</div> :
    					showEdgeForm ?
    						<div className="crud-form">
    
    							<div className="in-form">
    
    								<div className="heading">Edge </div>
    								{activeedge.data && activeedge.data.outcome ? <div><div>Outcome</div>
									 <textarea style={{width: "240px"}} value={activeedge.data.outcome} onChange={setEdgeOutcome} /> </div> : null}
    
    								<div>Label</div>   <textarea style={{width: "240px"}} value={activeedge.label} onChange={setEdgeLabel} />
    								<div className="script-form-btn" ><button onClick={submitForm}> Submit</button></div>
    							</div>
    						</div> : null
    
    
    
    
    
    				}
    
    
    
    
    
    				{/* <div>
    								<input type="text"
    								onChange={e => setName(e.target.value)}
    								name="title"/>
    								<button 
    								type="button"
    								onClick={addNode}
    								>Add Node</button>
    						</div> */}
    			</ReactFlowProvider>
    		</div>
				{ Prompt }
        </div>
	)

}
 
export default MindNode;
