import { Link } from "react-router";

const team = [
  {
    name: "Assaf Arkin",
    role: "CEO & Co-founder",
    description:
      "Repeat founder with years of experience working with LLMs and serving SMBs.",
    image: "/images/team/avatar-assaf.jpg",
    linkedIn: "https://www.linkedin.com/in/assafarkin/",
  },
  {
    name: "Jon Sofield",
    role: "Chief Marketplace Officer",
    description:
      "Scaled Google My Business to 100+ million users, VP of Business Development at several startups.",
    image: "/images/team/avatar-jon.jpg",
    linkedIn: "https://www.linkedin.com/in/jonsofield/",
  },
  {
    name: "Alex Storey",
    role: "Chief Sales Officer",
    description:
      "From channel growth at Google to starting multiple companies in the proptech space.",
    image: "/images/team/avatar-alex.jpg",
    linkedIn: "https://www.linkedin.com/in/a-c-s/",
  },
];

export default function AboutTeam() {
  return (
    <section className="bg-[hsl(60,100%,99%)] px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-4xl text-black leading-tight">
            Meet the Team
          </h2>
          <p className="mx-auto max-w-2xl font-medium text-black text-xl leading-relaxed">
            We're a diverse team of retail experts, technologists, and
            entrepreneurs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {team.map((member) => (
            <Link
              key={member.name}
              to={member.linkedIn}
              target="_blank"
              className="flex transform flex-col items-center rounded-[10px] border-2 border-black bg-white p-8 text-center shadow-[4px_4px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black]"
            >
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-black shadow-[2px_2px_0px_0px_black]">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full rounded-full"
                />
              </div>
              <h3 className="mb-1 font-bold text-black text-xl">
                {member.name}
              </h3>
              <p className="mb-3 font-bold text-[hsl(37,92%,65%)] text-sm">
                {member.role}
              </p>
              <p className="font-medium text-black text-sm leading-relaxed">
                {member.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
