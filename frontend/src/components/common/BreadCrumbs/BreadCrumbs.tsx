import "./BreadCrumbs.css";
import React from "react";
import { Link } from "react-router-dom";
import { type FC } from "react";
import { ROUTES } from "../../../Routes";

interface ICrumb {
  label: string;
  path?: string;
}

interface BreadCrumbsProps {
  crumbs: ICrumb[];
}

export const BreadCrumbs: FC<BreadCrumbsProps> = ({ crumbs }) => {
  return (
    <nav className="breadcrumbs" aria-label="Навигационная цепочка">
      <span className="crumb">
        <Link to={ROUTES.HOME}>Главная</Link>
      </span>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={index}>
            <span className="slash">/</span>
            {isLast ? (
              <span className="crumb current">{crumb.label}</span>
            ) : (
              <Link to={crumb.path || ""} className="crumb">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
