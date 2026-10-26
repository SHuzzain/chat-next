"use client";

import "katex/dist/katex.min.css";

import {
  StreamdownTextPrimitive,
  type StreamdownTextPrimitiveProps,
} from "@assistant-ui/react-streamdown";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { type FC, memo } from "react";

const streamdownPlugins = { code, math, mermaid };

export type MarkdownTextProps = Partial<StreamdownTextPrimitiveProps>;

const MarkdownTextImpl: FC<MarkdownTextProps> = ({
  plugins = streamdownPlugins,
  shikiTheme = ["github-light", "github-dark"],
  containerClassName,
  defer = true,
  caret = "block",
  controls = true,
  ...rest
}) => (
  <StreamdownTextPrimitive
    plugins={plugins}
    shikiTheme={shikiTheme}
    defer={defer}
    caret={caret}
    controls={controls}
    containerClassName={containerClassName ?? "aui-md text-foreground"}
    {...rest}
  />
);

export const MarkdownText = memo(MarkdownTextImpl);
