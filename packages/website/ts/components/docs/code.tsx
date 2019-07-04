import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { CodeRun } from 'ts/components/docs/code_run';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

interface ICodeProps {
    children: string;
    isRunnable?: boolean;
    lang?: 'html | typescript | solidity | python';
}

export const Code: React.FC<ICodeProps> = ({ children, lang = 'typescript', isRunnable = false }) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const copyButtonText = isCopied ? 'Copied!' : 'Copy';

    const handleCopyClick = () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 500);
    };

    const customStyle = {
        overflowX: 'scroll',
        padding: isRunnable ? '20px' : '10px',
        backgroundColor: isRunnable ? 'white' : 'none',
    };

    return (
        <CodeWrapper>
            <CopyToClipboard text={children} onCopy={handleCopyClick}>
                <CopyButton>{copyButtonText}</CopyButton>
            </CopyToClipboard>
            <SyntaxHighlighter
                language={lang}
                customStyle={customStyle}
                style={style}
                showLineNumbers={false}
                CodeTag={CodeTag}
                PreTag={PreTag}
                wrapLines={true}
            >
                {children}
            </SyntaxHighlighter>

            {isRunnable && <CodeRun />}
        </CodeWrapper>
    );
};

const GUTTER = '10px';
const BORDER_RADIUS = '4px';

const CodeWrapper = styled.div`
    position: relative;
    max-width: 700px;
    padding: ${GUTTER};
    background-color: ${colors.backgroundLight};
    border-radius: 0 ${BORDER_RADIUS} ${BORDER_RADIUS};
`;

const PreTag = styled.pre`
    border: 1px solid ${colors.backgroundLight};
    border-radius: ${BORDER_RADIUS};

    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */

    &::-webkit-scrollbar {
        width: 0;
        height: 0;
    }
`;

const CodeTag = styled.code`
    border: none;
    font-family: 'Roboto Mono', sans-serif;
    font-size: 0.875rem;
    line-height: 1.25em;
`;

const CopyButton = styled(Button)`
    position: absolute;
    right: 0;
    top: -48px;
    height: 32px;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 300;
    background: white;
    border: 1px solid ${colors.beigeWhite};
    border-radius: ${BORDER_RADIUS};
    color: ${colors.brandDark};
`;

const style = {
    'hljs-comment': {
        color: '#7e7887',
    },
    'hljs-quote': {
        color: '#7e7887',
    },
    'hljs-variable': {
        color: '#be4678',
    },
    'hljs-template-variable': {
        color: '#be4678',
    },
    'hljs-attribute': {
        color: '#be4678',
    },
    'hljs-regexp': {
        color: '#be4678',
    },
    'hljs-link': {
        color: '#be4678',
    },
    'hljs-tag': {
        color: '#61f5ff',
    },
    'hljs-name': {
        color: '#61f5ff',
    },
    'hljs-selector-id': {
        color: '#be4678',
    },
    'hljs-selector-class': {
        color: '#be4678',
    },
    'hljs-number': {
        color: '#c994ff',
    },
    'hljs-meta': {
        color: '#61f5ff',
    },
    'hljs-built_in': {
        color: '#aa573c',
    },
    'hljs-builtin-name': {
        color: '#aa573c',
    },
    'hljs-literal': {
        color: '#aa573c',
    },
    'hljs-type': {
        color: '#aa573c',
    },
    'hljs-params': {
        color: '#aa573c',
    },
    'hljs-string': {
        color: '#781818',
    },
    'hljs-function': {
        color: '#781818',
    },
    'hljs-symbol': {
        color: '#2a9292',
    },
    'hljs-bullet': {
        color: '#2a9292',
    },
    'hljs-title': {
        color: '#576ddb',
    },
    'hljs-section': {
        color: '#576ddb',
    },
    'hljs-keyword': {
        color: '#253C90',
    },
    'hljs-selector-tag': {
        color: '#253C90',
    },
    'hljs-deletion': {
        color: '#19171c',
        display: 'inline-block',
        width: '100%',
        backgroundColor: '#be4678',
    },
    'hljs-addition': {
        color: '#19171c',
        display: 'inline-block',
        width: '100%',
        backgroundColor: '#2a9292',
    },
    hljs: {
        display: 'block',
        overflowX: 'hidden',
        background: colors.backgroundLight,
        fontSize: '12px',
        paddingLeft: '20px',
        paddingTop: '20px',
        paddingBottom: '20px',
    },
    'hljs-emphasis': {
        fontStyle: 'italic',
    },
    'hljs-strong': {
        fontWeight: 'bold',
    },
};
