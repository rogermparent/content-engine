import React, { ReactNode } from "react";
import GithubIconSVG from "../../../images/github-mark.inline.svg";
import LinkedinIconSVG from "../../../images/linkedin.inline.svg";
import Image from "next/image";
import { Education, Experience, Project, Resume } from "@/controller/types";
import Markdown from "@/components/Markdown";
import Link from "next/link";

function GithubIcon() {
  return (
    <Image src={GithubIconSVG} alt="" className="inline-block w-4 h-4 mr-1" />
  );
}

function LinkedinIcon() {
  return (
    <Image src={LinkedinIconSVG} alt="" className="inline-block w-4 mr-1" />
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="text-2xl font-bold my-1 py-1 border-b-2 border-black">
      {children}
    </div>
  );
}

const ContactInfo = ({
  address,
  email,
  phone,
  github,
  linkedin,
  website,
}: {
  address?: string;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}) => {
  return (
    <div className="items-center justify-center mt-1 text-center">
      {address && (
        <div className="m-1 whitespace-nowrap">
          <span>{address}</span>
        </div>
      )}
      {email && (
        <span className="m-1 whitespace-nowrap">
          <Link target="_blank" href={`mailto://${email}`}>
            <span className="underline">{email}</span>
          </Link>
        </span>
      )}
      {phone && (
        <span className="m-1 whitespace-nowrap">
          <Link target="_blank" href={`tel://${phone}`}>
            <span className="underline">{phone}</span>
          </Link>
        </span>
      )}
      {website && (
        <span className="m-1 whitespace-nowrap">
          <Link href={`https://${website}`} target="_blank">
            <span className="underline">{website}</span>
          </Link>
        </span>
      )}
      {github && (
        <span className="m-1 whitespace-nowrap">
          <Link target="_blank" href={`https://github.com/${github}`}>
            <GithubIcon />
            <span className="underline">github.com/{github}</span>
          </Link>
        </span>
      )}
      {linkedin && (
        <span className="m-1 whitespace-nowrap">
          <Link target="_blank" href={`https://linkedin.com/in/${linkedin}`}>
            <LinkedinIcon />
            <span className="underline">linkedin.com/in/{linkedin}</span>
          </Link>
        </span>
      )}
    </div>
  );
};

const DateSpan = ({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) =>
  startDate ? (
    <>
      {" "}
      <span>
        {<span>{startDate}</span>}
        {endDate && (
          <>
            {" - "}
            <span>{endDate}</span>
          </>
        )}
      </span>
    </>
  ) : null;

const EducationList = ({ education }: { education?: Education[] }) => {
  return education && education.length > 0 ? (
    <div className="mt-4">
      <SectionHeading>Education</SectionHeading>
      <ul>
        {education.map(({ achievement, school, startDate, endDate }, i) => (
          <li key={i}>
            {achievement && <div className="font-bold">{achievement}</div>}
            {school && (
              <div>
                {school}
                {startDate && (
                  <div>
                    <DateSpan startDate={startDate} endDate={endDate} />
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  ) : null;
};

const ExperienceList = ({
  experience,
}: {
  readonly experience?: Experience[];
}) => {
  return experience && experience.length > 0 ? (
    <div className="mt-2">
      <SectionHeading>Experience</SectionHeading>
      <ul>
        {experience.map(
          ({ startDate, endDate, description, title, company }, i) => (
            <li key={i} className="mt-2 text-sm ml-1">
              <div className="my-1">
                <div className="text-lg font-bold">{title}</div>
                <div className="text-base">{company}</div>
                {startDate && (
                  <div>
                    <DateSpan startDate={startDate} endDate={endDate} />
                  </div>
                )}
              </div>
              {description && <Markdown>{description}</Markdown>}
            </li>
          ),
        )}
      </ul>
    </div>
  ) : null;
};

const ProjectLink = ({ url }: { url: string }) => {
  const githubResult = /^https:\/\/github.com\/(.*)/.exec(url);
  if (githubResult) {
    const repoName = githubResult[1];
    return (
      <>
        <Link href={url} target="_blank" className="underline">
          <GithubIcon />
          {repoName}
        </Link>{" "}
      </>
    );
  }
  return (
    <Link href={url} target="_blank">
      {url}
    </Link>
  );
};

const ProjectsList = ({ projects }: { readonly projects?: Project[] }) => {
  return projects && projects.length > 0 ? (
    <div>
      <SectionHeading>Projects</SectionHeading>
      <ul className="pl-1">
        {projects.map(({ description, url, name, startDate, endDate }, i) => (
          <li key={i}>
            <div className="my-2">
              <div className="font-bold text-lg">{name}</div>
              {startDate && (
                <div>
                  <DateSpan startDate={startDate} endDate={endDate} />
                </div>
              )}
              {url && (
                <div className="text-sm">
                  {url.map((itemUrl, i) => (
                    <ProjectLink url={itemUrl as string} key={i} />
                  ))}
                </div>
              )}
            </div>
            {description && <Markdown>{description}</Markdown>}
          </li>
        ))}
      </ul>
    </div>
  ) : null;
};

const SkillsList = ({ skills }: { skills?: string[] }) => {
  return (
    <div className="mt-4">
      <SectionHeading>Skills</SectionHeading>
      <ul className="font-bold text-lg justify-center items-center">
        {skills?.map((skill, i) => (
          <li key={skill} className="my-1 mx-1 inline-block">
            {skill}
            {i < skills.length - 1 && ", "}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ResumeView = ({ resume }: { readonly resume?: Resume }) => {
  const {
    job,
    education,
    experience,
    projects,
    skills,
    github,
    address,
    email,
    name,
    phone,
    linkedin,
    website,
  } = resume || {};
  return (
    <div className="bg-white text-black w-full h-full p-2 print:p-0 justify-center">
      <div className="shrink-0 pr-4">
        <div>
          <div className="text-center">
            {name && <div className="text-3xl font-bold">{name}</div>}
            {job && <div className="text-xl my-1">{job}</div>}
          </div>
          <div>
            <ContactInfo
              phone={phone}
              email={email}
              address={address}
              github={github}
              linkedin={linkedin}
              website={website}
            />
          </div>
          <ExperienceList experience={experience} />
          <ProjectsList projects={projects} />
          <EducationList education={education} />
          <SkillsList skills={skills} />
        </div>
      </div>
    </div>
  );
};
