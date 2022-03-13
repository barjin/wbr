import Where from "./Where";
import { WorkflowFile } from '../wbr-types/workflow';
import What from "./What";

type PairType = WorkflowFile['workflow'][number];

export default function Pair({pair, updater}: {pair: PairType, updater: Function}) : JSX.Element {
    const updateWhere = (where: typeof pair.where) => {
        updater({
            ...pair,
            where: where
        })
    }

    return (
        <div className='pair'>
            <h1>{pair.id}</h1>
            <h2>If...</h2>
            <Where where={pair.where} updater={updateWhere}/>
            <h2>Then...</h2>
            <What what={pair.what}/>
        </div>
    )
}