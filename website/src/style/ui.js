import { css } from '@emotion/core';
import theme from "./theme";
import { ReactComponent as logo } from "../assets/logo.svg";
import { ReactComponent as backIcon } from '../assets/arrow-left.svg';
import styled from "@emotion/styled";
import React from "react";


export const LinkCss = (bg0, bg1, txt0, txt1) => css`
  text-decoration: none;
  // horizontal offset | vertical offset | blur radius | spread radius | color
  box-shadow: inset 0 -2px 0 ${bg0};
  transition: 0.2s ease-in-out all;
  color: ${txt0};
  &:hover {
    box-shadow: inset 0 -50px 0 ${bg1};
    color: ${txt1};
    border-radius: 5px;
  }
`;

export const ButtonCss = css`
  padding: 12px 20px;
  background: ${theme.color.red};
  color: ${theme.color.white};
  border-radius: 8px !important;
  font-size: ${theme.size(0.9)};
  ${LinkCss(
  theme.color.red,
  theme.color.amaranth,
  theme.color.white,
  theme.color.white
)};
  &:hover {
    transform: scale(1.05);
  }
  &:active {
    transform: scale(1.1);
  }
`;

export const BackgroundAppear = css`
  animation: 1s ease-in-out bcgAppear forwards;
  @keyframes bcgAppear {
    0% { opacity: 0 }
    100% { opacity: 0.6 }
  }
`;

export const SubtitleCss = css`
  font-size: 2em;
  text-align: center;
  z-index: 2;
  color: ${theme.color.red};
`;

export const Header = styled.header`
  width: 100vw;
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  @media (max-width: 700px) {
    padding: 40px 0;
  }
`;

export const Title = styled.h1`
  font-size: ${p => p.theme.size(1.8)};
  color: ${p => p.theme.color.white};
  margin-top: 10px;
  margin-bottom: 25px;
  z-index: 1;
  & > span {
    color: ${p => p.theme.color.red};
  }
  & > a {
    padding: 0 2px;
    ${p => LinkCss(
  p.theme.color.red,
  p.theme.color.red,
  p.theme.color.red,
  p.theme.color.white
)};
  }
  @media (max-width: 700px) {
    font-size: ${p => p.theme.size(1)};
    text-align: center;
    width: 90%;
    margin-bottom: 10px;
    margin-top: 5px;
  }
`;

export const Subtitle = styled.h3`
  ${SubtitleCss};
  padding-bottom: 2em;
`;

export const Logo = styled(logo)`
  margin: 20px;
  width: 100px;
  height: 100px;
  z-index: 1;
  @media (max-width: 700px) {
    height: 70px;
    margin: 10px;
  }
`;

export const Body = styled.div`
  position: relative;
  z-index: 1;
  min-height: 60vh;
  ${p => p.withoutPadding ? 'padding-bottom: 80px;' : 'padding: 60px 0;'};
  background: ${p => p.theme.color.light};
`;

export const ResultsWrapper = styled.div`
  min-height: 40vh;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0 auto;
  width: 80%;
`;

export const LoadingWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 11;
  display: flex;
  justify-content: center;
  backdrop-filter: blur(7px);
  svg:only-child {
    height: 150px !important;
    width: 150px !important;
    margin-top: 100px;
    color: ${p => p.theme.color.red};
    filter: glow(1);
  }
`;

export const ResultsCountTitle = styled.strong`
  color: ${p => p.theme.color.dark};
  font-size: ${p => p.theme.size(1.6)};
  text-align: center;
  display: block;
  padding-bottom: 50px;
`;

export const BackButton = ({ onClick }) => (
  <BackButtonEle onClick={onClick}>
    <LeftArrow/>
  </BackButtonEle>
)

const BackButtonEle = styled.button`
  border-radius: 20px;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1;
  path {
    transform-origin: center;
    transition: 0.2s ease-in-out all;
    fill: ${p => p.theme.color.light};
  }
  &:hover {
    path {
      transform: scale(1.1);
      fill: ${p => p.theme.color.red};
    }
  }
`;

const LeftArrow = styled(backIcon)`
  width: 30px;
  height: 30px;
`;
